const http = require('http');
const webtools = require('./modules/httptools');
const sqltools = require('./modules/sqltools');

const socket = require('websocket');
const mysql = require('mysql'); // Not in use yet
const dbConfig = require('./dbConfig.js')
const cardgame = require('./modules/cards_foundation');
const bjackGame = require('./modules/blackjack');

let connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
    if (err) { throw err } else {
        console.log("Connected to database successfully.");
    };
});

let port = 3000,
    ip = "127.0.0.1",
    acceptedOrigin = `http://${ip}:${port}`;

const pathPublic = "./";
const defaultHTML = "html/blackjack.html";

class user {
    constructor(connection) {
        this.ID = null,
        this.playerObj = null;
        this.connection = connection;
    }
};

let activeGames = [];

//########  Webserver
const webserv = http.createServer((req, res) => {
    let method = req.method,
        url = req.url;
    
    //Handle GET requests
    if (method == "GET") {

        //Adapt url in-case of a login/registration -- Find way to determine registration or login
        if (req.url.indexOf("/?") == 0)
            url = "loginSystem";

        switch(url) {
            case "/":
                webtools.fileResponse(defaultHTML, pathPublic, res)
                break;
            case "loginSystem": //--- Determine login or registration
                let input = req.url.split("=");
                let username = input[1].split("&")[0];
                let password = input[2];
                loginUser(username, password);
                //registerUser(username, password);
                break;
            default:
                webtools.fileResponse(req.url, pathPublic, res)
                break;
        }
    } else {
        console.log(`Method: ${req.method}, url: ${req.url}`);
    }


    async function registerUser(username, password) {
        console.log("i fucknig hate this stupid ass nigga bitch group");
        //Check for username
       /* connection.query(`SELECT username FROM account WHERE username='${username}'`, (error, result, fields) => {
            if (error) {
                throw error;
            } else if (result.length > 0) {
                    //Notify user, user already exists
            } else {
                //Check password isn't empty.
                if (password.length > 0) {
                    //Register user
                    connection.query(`INSERT INTO account (username, password) VALUES ('${username}', '${password}')`);
                }

                //Throw error, user had empty password
            }
        }); */
    }

    async function loginUser(username, password) {
        connection.query(`SELECT username, password FROM account WHERE username='${username}' AND password='${password}'`, (error, result, fields) => {
            if (error) {
                throw error;
            } else if (password.length == 0) {
                    //Notify user, error password empty
            } else if (result.length > 0) {
                //Login user
                console.log("Successful login");
                webtools.fileResponse(defaultHTML, pathPublic, res)

                /*Update user with relevant info
                    - Currency
                    - Secret
                        - Random string -> generate on login                   
                */
            } else {
                //User doesn't exist or password is wrong
            }
            //Throw error, user had empty password
        });
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
        playerObj = new cardgame.Player(),
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
            if (msg.type == "game") gamehandler(msg);
       /*  } catch (err) { //Wrong type of message, print error.
            console.error(err);
            return;
        } */
    });

    //Handle closed connection
    connection.on('close', (connection) => {
        //Remove player from its active game
        //Destroy player
    });


    function userhandler(message) {
        switch(message.content) {
            case "register":
                registerUser();
                break;
            case "login":
                loginUser();
                break;
            default:  break;
            }
        }

    //Handles all the blackjack game logic
    function gamehandler(message) {
        switch(message.content) {
            case "startgame":
                activeGames.push(new bjackGame());
                playerObj.join(activeGames[activeGames.length-1]);
                game = playerObj.game;
                initGame();
                break;
            case "newgame":
                activeGames[0] = new bjackGame();
                playerObj = new cardgame.Player();
                playerObj.connection = connection;
                playerObj.join(activeGames[0]);
                game = playerObj.game;
                initGame();
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
                break;
            default:  break;
        }
        update();
    }
    function update() {
        let updateResponse = {  type: "blackjack", content: "update", players: []   };
        
        //For each player active in the game
        for (let i = 0; i < game.players.length; i++) {
            let playersResponse = {hands: [], insurance: 0};

            let player = game.players[i];
            let hands = player.hands;

            //For each hand active for the player
            for (let x = 0; x < player.hands.length; x++) {
                let hand = player.hands[x];
                let value = game.getCardsValue(hand.cards);
                playersResponse.hands.push( {   cards: hand.cards, bet: hand.bet, 
                                            isHolding: hand.isHolding, winner: hand.winner, points: value }  );
            }

            playersResponse.insurance = player.insurance;
            updateResponse.players.push(playersResponse);
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
        response.bet = playerObj.hands[activeHand].bet;
        response.player.hand = activeHand;
    }

    function initGame() {
        if (game.dealer.length == 0)
            game.initialize(4);
        else
            handleNewJoin();
        
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

        /* response.content = "game created";
        response.player.cards = playerObj.hands[activeHand].cards;
        response.dealer.cards = game.dealer;
        updateResponsePoints();
        send(response); */

        return;
    }

    /* function updateWinnings() {
        for(let i = 0; i < players.length; i++) {
            for(let j = 0; j <= hands.length; j++) {
                currencyCalculator(hand, player.insurance);
            }
        }
    }

    //Currency update method to add/subtract currency in-game
    //OBS!    playerObj.currencyAmount skal ændres til noget fra db'en
    function currencyCalculator(message) {
        //Withdraws the correct amount of money in case the player insures
        if (insurance > 0 && "winner") {
            playerObj.currencyAmount += hand.bet / 2;
            return;
        }
        else if (insurance > 0 && !"winner") {
            playerObj.currencyAmount -= hand.bet * 1.5
            return;
        }
        
        //Withdraws the correct amount of money
        if ("winner") {
            playerObj.currencyAmount += hand.bet;
            return;
        }
        else if (!"winner") {
            playerObj.currencyAmount -= hand.bet;
            return;
        }
    } */

    function handleHit() {
        response.content = "card";
        game.hit(playerObj.hands[activeHand]);
        response.player.cards = playerObj.hands[activeHand].cards;
        
        updateResponsePoints();
        send(response);

        //In case of a bust or blackjack
        if (response.player.points >= 21) {
            handleHold();
        }

        //Next hand
        if (playerObj.hands.length > 1 && activeHand != (playerObj.hands.length -1 ) )
            activeHand++;
        else
            activeHand = 0;
    }

    function handleHold() {
        response.content = "winner";
        game.hold(playerObj.hands[activeHand]);

        updateResponsePoints();
        response.dealer.cards = game.dealer;
        response.player.cards = playerObj.hands[activeHand].cards;

        response.win = playerObj.hands[activeHand].winner;
        
        send(response);
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

    function handleBet(msg) {
        let bet = msg.amount;
        /*
            let currency = getPlayerCurrencyOfSomeSort();
            if (currency >= bet) {
                game.bet(playerObj.hands[activeHand], bet);

                //Response code
                response.content = "card";
                response.player.cards = playerObj.hands[activeHand].cards;
                updateResponsePoints();
                send(response);
            }
        */

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