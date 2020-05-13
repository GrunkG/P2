const http = require('http');
const webtools = require('./modules/httptools');
const sqltools = require('./modules/sqltools');

const socket = require('websocket');
const mysql = require('mysql'); // Not in use yet
const dbConfig = require('./dbConfig.js')
const cardgame = require('./modules/cards_foundation');
const blackjackGame = require('./modules/blackjack').Blackjack;
const blackjackPlayer = require('./modules/blackjack').Blackjack_player;

const bcrypt = require("bcrypt-nodejs"); //Used for cryptation

let sqlconnection = mysql.createConnection(dbConfig);

sqlconnection.connect((err) => {
    if (err) { throw err } else {
        console.log("Connected to database successfully.");
    };
});

let port = 3000,
    ip = "127.0.0.1",
    acceptedOrigin = `http://${ip}:${port}`;

const pathPublic = "./";
const defaultHTML = "html/blackjack.html";

class user extends blackjackPlayer {
    constructor() {
        super();
        this.games_played = 0;
        this.games_won = 0;
        this.games_lost = 0;
        this.games_drawn = 0;
        this.exp = 0,
        this.username = null;
        this.secret = null;
        this.connection = null;
    }
};

class multiplayer_blackjack extends blackjackGame {
    constructor() {
        super();
    }

    kickAFK() {
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            for (let h = 0; h < player.hands.length; h++) {
                let hand = player.hands[h];
                if (!hand.isHolding) {
                    this.removePlayer(player);
                }
            }
        }

        this.endGame();
    }
}

let activeGames = [];

//########  Webserver
const webserv = http.createServer((req, res) => {
    let method = req.method,
        url = req.url;
    
    //Handle GET requests
    if (method == "GET") {
        switch(url) {
            case "/":
                webtools.fileResponse(defaultHTML, pathPublic, res)
                break;
            /* case "loginSystem": //--- Determine login or registration
                let input = req.url.split("=");
                let username = input[1].split("&")[0];
                let password = input[2];
                loginUser(username, password);
                //registerUser(username, password);
                break; */
            default:
                webtools.fileResponse(req.url, pathPublic, res)
                break;
        }
    } else {
        console.log(`Method: ${req.method}, url: ${req.url}`);
    }

});

webserv.listen(port, ip, () => {
    let d = new Date();
    console.log(`[${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}] > Server listening at ${acceptedOrigin}`);
});

//######## WebSockets - Active game(s) handler
const gameserv = new socket.server({httpServer: webserv});

//Boolean, is origin input equals to the accept origin?
function isAcceptedOrigin(origin) {
    return (origin == acceptedOrigin) ? true : false;
}

//WebSocket Event Handler
gameserv.on('request', (req) => {
    //Only allow connections from our own website origin
    if (!isAcceptedOrigin(req.origin)) {
        console.log("Rejected connection from " + req.origin);
        req.reject();
        return;
    }

    //Accept connection and start handling events from the new connection
    //Everything runs asyncron for each new connection.
    let connection = req.accept(null, req.origin);
    console.log("Connection accepted from origin: " + req.origin);

    let game, //Active game
        playerObj = new user(),
        response = { type: "blackjack", content: "",
                    //Player response object
                    player: {hand: 0, cards: [], points: 0, winner: null, bet: 0, insurance: 0},
                    //Dealer response object
                    dealer: {cards: [], points: 0} },
        activeHand = 0; //Current playing hand -> 0 unless player has been able to split.

    playerObj.connection = connection;

    //Handle incoming messages from connection
    connection.on('message', (message) => {
        if (message.type != "utf8") return;
        
        //Try and convert message to an easy to handle JSON object.
        //try { 
            let msg = JSON.parse(message.utf8Data);
            console.log(message.utf8Data);
            if (msg.type == "game") gamehandler(msg);
            if (msg.type == "loginsystem") userhandler(msg);
        /* } catch (err) { //Wrong type of message, print error.
            console.error(err);
            return;
        }  */
    });

    //Handle closed connection
    //TODO: Remove player from remotes in an active game
    connection.on('close', (connection) => {
        //Remove player from its active game
        if (game != null) {
            game.leave(playerObj);
            cleanUpInactiveGames();
        }
    });

    function clearResponse() {
        response = { type: "blackjack", content: "",
        //Player response object
        player: {hand: 0, cards: [], points: 0, winner: null, bet: 0, insurance: 0},
        //Dealer response object
        dealer: {cards: [], points: 0} };
    }

    function userhandler(message) {
        switch(message.content) {
            case "register":
                registerUser(message.user, message.pass);
                break;
            case "login":
                loginUser(message.user, message.pass);
                break;
            case "logout":
                logoutUser(message.user, message.secret);
            default:  break;
        }
    }

    function registerUser(username, password) {
        //Check for username
        sqlconnection.query(`SELECT username FROM account WHERE username='${username}'`, (error, result, fields) => {
            if (error) {
                throw error;
            } else if (result.length > 0) {
                    //Notify user, user already exists
                    send({type: "register", state: "exists"});
            } else {
                //Check password isn't empty.
                if (password.length > 0) {
                    //Register user
                    let passwordEncrypted = bcrypt.hashSync(password, null, null);
                    sqlconnection.query(`INSERT INTO account (username, password) VALUES ('${username}', '${passwordEncrypted}')`);
                    send({type: "register", state: "success"});
                } else if (password.length == 0) {
                    send({type: "register", state: "zeropassword"});
                }
                
                //Throw error, user had empty password
            }
        }); 
    }

    function loginUser(username, password) {
        //let test = sqlconnection.query(`SELECT currency, ID FROM account WHERE username='${username}' AND password='${password}'`, (error, result, fields) => {
            //connection.query("SELECT * FROM account WHERE username = ? ", [username], (error, rows) => {
        let test = sqlconnection.query(`SELECT currency, games_won, games_drawn, games_lost, games_played, ID, password FROM account WHERE username='${username}'`, (error, result, fields) => {
            if (error) {
                throw error;
            } else if (password.length == 0) {
                    //Notify user, error password empty
                    send({type: "login", state: "zeropassword"});
            } else if (result.length > 0 && result[0].password.length > 15 && bcrypt.compareSync(password, result[0].password)) {
                //Login user
                
                //Generate random secret string to identify a session
                let secret = generateSecret();

                sqlconnection.query(`UPDATE account SET secret = '${secret}' WHERE ID = '${result[0].ID}'`, (error, result, fields) => {
                    if (error)
                        throw error;
                });
                send({type: "login", state: "success", currency: result[0].currency, games_won: result[0].games_won, games_lost: result[0].games_lost,
                                                       games_played: result[0].games_played, games_drawn: result[0].games_drawn, identity: secret, username: username});
            } else {
                //User doesn't exist or password is wrong
                send({type: "login", state: "noexist"});
            }
            //Throw error, user had empty password
        });

       // console.log(test);
    }

    function generateSecret() {
        return Math.random().toString(16).substring(2);
    }

    function logoutUser(username, secret) {
        //Remove user from game --
        //Remove "session"
        //-> Clientside show login --
        //Update game for remaininding players, if game wasn't empty --
        //Reset player connection
        console.log(`Logging out!:: S: ${secret}, U: ${username}`);
        //Find game in which the user is active
        for (let i = 0; i < activeGames.length; i++) {
            let game = activeGames[i];
            for (let p = 0; p < game.players.length; p++) {
                let player = game.players[p];
                if (player.username == username && player.secret == secret) { 
                    console.log("Found the player and game!");
                    //Correct user is found on this loop-through
                    //Maybe cards back in deck (bottom)
                    game.players.splice(p,1); //Remove player from index p
                    if (game.players.length > 0)
                        update(); //Update remotes for remainding players
                    else
                        cleanUpInactiveGames();

                    playerObj = new user(); //Reset player object, important info will be set upon next login
                    clearResponse();
                }
            }
        }
    }
    
    
    //Handles all the blackjack game logic
    function gamehandler(message) {
        switch(message.content) {
            case "startgame":
                console.log("Starting new game!");
                playerObj.username = message.username;
                playerObj.secret = message.secret;
                playerObj.currency = parseInt(message.currency);
                handleStartGame()
                break;
            case "newgame":
                game.resetGame();
                game.resetPlayers();
                //initGame();
                handleNewGame();
                //Debug
                //game.dealer[1] = {suit: "C", val: "A", visible: true}
                break;
            /* case "joingame":
                handleNewJoin();
                break; */
            case "hit":
                handleHit();
                break;
            case "hold":
                handleHold()
                break;
            case "double":
                handleDouble();
                break;
            case "split":
                handleSplit();
                break;
            case "insure":
                handleInsurance();
                break;
            case "bet":
                handleBet(message);
                newGame();
                break;
            case "test":
                console.log(game);
                break;
            default:  break;
        }
        update();
    }

    function handleStartGame() {
        let joined = false;
        if (playerObj.currency > 0) {
            for (let i = 0; i < activeGames.length; i++) {
                if (activeGames[i] == null)
                    continue;

                if (activeGames[i].players.length < 8) { // 8 is max players
                    //Game isn't full
                    //game.isEveryoneDone()
                    if (!activeGames[i].isGameStarted()) {
                        playerObj.join(activeGames[i]);
                        game = playerObj.game;
                        //game.hold(playerObj.hands[0]); //Player isn't active in this game, hold from the start.
                        initGame();
                        joined = true;
                    }
                }
            }

            if (!joined) {
                //Too many players in all active games, start new game.
                activeGames.push(new multiplayer_blackjack()); //Starts new game
                playerObj.join(activeGames[activeGames.length-1]); //length -1 due to 0 index
                game = playerObj.game;
                initGame();
            }
        }
    }

    function handleNewGame() {
        game.leave(playerObj);
        cleanUpInactiveGames();

        handleStartGame();
    }

    //Remove in-active games from the activeGames array.
    function cleanUpInactiveGames() {
        for (let i = 0; i < activeGames.length; i++) {
            let players = activeGames[i].players.length;
            if (players == 0)
                activeGames.splice(i, 1);
        }
    }

    function update() {
            let updateResponse = {  type: "blackjack", content: "update" , players: []   };
            if (game == null)
                return;

            //For each player active in the game
            for (let i = 0; i < game.players.length; i++) {
                let playersResponse = {hands: [], insurance: 0, username: null},
                    player = game.players[i],
                    bet = 0;

                playersResponse.username = player.username;
                //For each hand active for the player
                for (let x = 0; x < player.hands.length; x++) {
                    let hand = player.hands[x],
                        value = game.getCardsValue(hand.cards);;
                    bet += hand.bet;
                    playersResponse.hands.push( {   cards: hand.cards, bet: hand.bet, 
                                                isHolding: hand.isHolding, winner: hand.winner, points: value }  );
                }

                //Don't push the player for update, unless they have bet.
                //If the player hasn't bet, then they're not in play.
                if (bet > 0) {
                    playersResponse.insurance = player.insurance;
                    updateResponse.players.push(playersResponse);
                }
            }

            //send(updateResponse);
            //Send to all
            for (let i = 0; i < game.players.length; i++) {
                let player = game.players[i];
                player.connection.send( JSON.stringify(updateResponse) );
            }
    }

    function updateResponsePoints() {
        response.player.points = game.getCardsValue(playerObj.hands[activeHand].cards);
        response.dealer.points = game.getCardsValue(game.dealer);
        response.player.bet = playerObj.hands[activeHand].bet;
        response.player.hand = activeHand;
    }

    function initGame() {
        if (game.dealer.length == 0)
            game.initialize(4);
        else
            handleNewJoin();
        
        //newGame();
        activeHand = 0;
        playerObj.currency = 0;
        clearResponse();
    }

    function newGame() {
        response.content = "game created";
        response.player.cards = playerObj.hands[activeHand].cards;
        response.dealer.cards = game.dealer;
        updateResponsePoints();
        send(response);
    }

    function handleNewJoin() {
        for (let i = 0; i < 2; i ++) {
            game.hit(playerObj.hands[activeHand]);
        }
    }

    function updateWinnings() {
        for(let i = 0; i < game.players.length; i++) {
            let player = game.players[i];
            for(let j = 0; j < player.hands.length; j++) {
                let hand = player.hands[j];
                currencyCalculator(hand, player, player.insurance);
            }

            updatePlayerStats(player);

            //Update database                                           + - = negative / + + = positive
            sqlconnection.query(`UPDATE account SET currency = currency + ${player.currency} WHERE secret = '${player.secret}'`);
            sqlconnection.query(`UPDATE account SET games_won = games_won + ${player.games_won} WHERE secret = '${player.secret}'`);
            sqlconnection.query(`UPDATE account SET games_lost = games_lost + ${player.games_lost} WHERE secret = '${player.secret}'`);
            sqlconnection.query(`UPDATE account SET games_drawn = games_drawn + ${player.games_drawn} WHERE secret = '${player.secret}'`);
            sqlconnection.query(`UPDATE account SET games_played = games_played + ${player.games_played} WHERE secret = '${player.secret}'`);
        }
    }

    //Currency update method to add/subtract currency in-game
    //OBS!    playerObj.currencyAmount skal ændres til noget fra db'en
    function currencyCalculator(hand, player, insurance) {
        //Withdraws the correct amount of money in case the player insures
        if (insurance > 0 && dealerHasBlackjack()) {
            player.currency += insurance * 2;
            console.log("Won insurance");
        } else if (insurance > 0 && !dealerHasBlackjack()) {
            player.currency -= insurance;
            console.log("Lost insurance");
        }
        
        //Withdraws the correct amount of money and add stats
        
        if (hand.winner == "W") {
            player.currency += hand.bet;          
        } else if (hand.winner == "L") {
            player.currency -= hand.bet;
        }
    }

    function updatePlayerStats(player) {
        //console.log("Updating player stats");
        //console.log(playerObj);
        for (let i = 0; i < player.hands.length; i++) {
            let hand = player.hands[i];
            player.games_played++;
            if (hand.winner == "W") {
                player.games_won++;           
            } else if (hand.winner == "L") {
                player.games_lost++;
            } else {
                player.games_drawn++;
            }
        }
    }

    function dealerHasBlackjack() {
        let dealer = game.dealer;
        let total = game.getCardsValue(dealer);
        if (dealer[1].val == "A" && total == 21)
            return true;
        else
            return false;
    }

    function handleHit() {
        if (game.isPlayerInGame(playerObj)) {
            response.content = "card";
            game.hit(playerObj.hands[activeHand]);
            response.player.cards = playerObj.hands[activeHand].cards;
            
            updateResponsePoints();
            send(response);

            //In case of a bust or blackjack
            if (response.player.points >= 21) {
                handleHold();
            }

            setNextHand();
        }
    }

    function setNextHand() {
        //Next hand
        if (playerObj.hands.length > 1)
            activeHand++;
        if (activeHand == playerObj.hands.length)
            activeHand = 0;
    }

    function handleHold() {
        if (game.isPlayerInGame(playerObj)) {
            game.hold(playerObj.hands[activeHand]);
            setTimeout(()=> {
                game.kickAFK();
                announceWinner();
            }, 5000);
            setNextHand();
            if (game.isEveryoneDone())
                announceWinner();
            //else
                /* setTimeout(()=> {
                game.kickAFK();
                announceWinner();
            }, 5000);*/
        }
    }

    function announceWinner() {
        console.log("Announced winner");
        if (game.isEveryoneDone()) {
            //Send announcement to everyone, not just the last player to trigger a hold
            for (let i = 0; i < game.players.length; i++) {
                let player = game.players[i];
            
                let response = {type: "blackjack", content: "done", wins: [], insurance: "L", dealer: {cards: [], points: 0} };

                for (let i = 0; i < player.hands.length; i++) {
                    response.wins.push(player.hands[i].winner);
                }

                response.dealer.cards = game.dealer;
                response.dealer.points = game.getCardsValue(game.dealer);

                if (dealerHasBlackjack())
                    response.insurance = "W";

                updateWinnings();

                player.connection.send( JSON.stringify(response) );
            }
        }
    }

    function handleDouble() {
        let hand = playerObj.hands[activeHand];
        if (hand.cards.length == 2) {
            game.double(hand);
            handleHold();
        }
    }

    //May need refinement, depending on how visualization implementation turns out.
    function handleSplit() {
        let hand = playerObj.hands[activeHand];
        if ( game.split(playerObj, hand) == true) {

            //Hand has been split, response with new hand
            response.content = "split";
            updateResponsePoints();
            send(response);
        }
    }

    function handleInsurance() {
        //If insurance was possible
        if(game.insurance(playerObj) == true) {

            //Prepare response -> Set response insurance to active insurance.
            response.player.insurance = playerObj.insurance;
            response.content = "insurance";
            send(response);
        }
    }

    function handleBet(msg) { //Send cards here
        let bet = msg.amount;

        //playerObj.secret = msg.secret; // Hackfix?
        game.bet(playerObj.hands[activeHand], bet);
        //Reponse code
        response.content = "card";
        response.player.cards = playerObj.hands[activeHand].cards;
        updateResponsePoints();
        send(response);
    }

    function send(message) {
        connection.send( JSON.stringify(message) );
    }
});