const http = require('http');
const webtools = require('./modules/httptools');
const sqltools = require('./modules/sqltools');

const socket = require('websocket');
const mysql = require('mysql'); // Not in use yet
const dbConfig = require('./dbConfig.js')
const cardgame = require('./modules/cards_foundation');
const bjackGame = require('./modules/blackjack');

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
    } else if (method == "POST") {
      /*   let data = [];
        req.on('data', (chunk) => {
            data.push(chunk);
        }).on('end', () => {
            data = Buffer.concat(data).toString();
            console.log("url: " + req.url + ": " + data);

            let username = data.split("&")[0].split("=")[1];
            let password = data.split("&")[1].split("=")[1];

            switch(req.url) {
                case "/html/login":
                    loginUser(username, password);
                    break;
                case "/html/register":
                    registerUser(username, password);
                    break;
                default: break;
            }

            // res.statusCode = 200;
            // res.end('\n'); //response is empty 
        });*/
    } else {
        console.log(`Method: ${req.method}, url: ${req.url}`);
    }


    /* async function registerUser(username, password) {
        //Check for username
       connection.query(`SELECT username FROM account WHERE username='${username}'`, (error, result, fields) => {
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
        }); 
    } */

    /* async function loginUser(username, password) {
        connection.query(`SELECT username, password FROM account WHERE username='${username}' AND password='${password}'`, (error, result, fields) => {
            if (error) {
                throw error;
            } else if (password.length == 0) {
                    //Notify user, error password empty
            } else if (result.length > 0) {
                //Login user
                console.log("Successful login");
                webtools.fileResponse(defaultHTML, pathPublic, res)

                //Update user with relevant info
                //    - Currency
                //    - Secret
                //        - Random string -> generate on login                   
                

                res.statusCode = 200;
                res.end('\n'); //response is empty 
            } else {
                //User doesn't exist or password is wrong
            }
            //Throw error, user had empty password
        });
    }  */

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
        activeHand = 0, //Current playing hand -> 0 unless player has been able to split.
        currency = 0,
        userID = "";

    playerObj.connection = connection;

    //Handle incoming messages from connection
    connection.on('message', (message) => {
        if (message.type != "utf8") return;
        
        //Try and convert message to an easy to handle JSON object.
        //try { 
            let msg = JSON.parse(message.utf8Data);
            if (msg.type == "game") gamehandler(msg);
            if (msg.type == "loginsystem") userhandler(msg);
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
                registerUser(message.user, message.pass);
                break;
            case "login":
                loginUser(message.user, message.pass);
                break;
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
                    console.log("Was ehreee");
                    send({type: "register", state: "exists"});
            } else {
                //Check password isn't empty.
                if (password.length > 0) {
                    //Register user
                    sqlconnection.query(`INSERT INTO account (username, password) VALUES ('${username}', '${password}')`);
                    send({type: "register", state: "success"});
                } else if (password.length == 0) {
                    send({type: "register", state: "zeropassword"});
                }
                
                //Throw error, user had empty password
            }
        }); 
    }

    function loginUser(username, password) {
        let test = sqlconnection.query(`SELECT currency, ID FROM account WHERE username='${username}' AND password='${password}'`, (error, result, fields) => {
            if (error) {
                throw error;
            } else if (password.length == 0) {
                    //Notify user, error password empty
                    send({type: "login", state: "zeropassword"});
            } else if (result.length > 0) {
                //Login user
                console.log("Successful login");
                //console.log(`Results: ${JSON.stringify(result)} :: fields: ${JSON.stringify(fields)}`);
                

                //Generate random secret string to identify a session
                let secret = generateSecret();

                sqlconnection.query(`UPDATE account SET secret = '${secret}' WHERE ID = '${result[0].ID}'`, (error, result, fields) => {
                    if (error) {
                        throw error;
                    } else {
                        //Success
                    }
                });

                send({type: "login", state: "success", currency: result[0].currency, identity: secret});
            } else {
                //User doesn't exist or password is wrong
                send({type: "login", state: "noexist"});
            }
            //Throw error, user had empty password
        });

        test.on('result', (row) => {
            console.log(row);
        });
    }

    function generateSecret() {
        return Math.random().toString(16).substring(2);
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
        let updateResponse = {  type: "blackjack", content: "update" , players: []   };
        
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
        response.player.bet = playerObj.hands[activeHand].bet;
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

    function updateWinnings() {
        for(let i = 0; i < game.players.length; i++) {
            let player = game.players[i];
            for(let j = 0; j < player.hands.length; j++) {
                let hand = player.hands[j];
                currencyCalculator(hand, playerObj.insurance);
            }
        }

        //Update database
        sqlconnection.query(`UPDATE account SET currency = currency + ${currency} WHERE secret = '${userID}'`);
        //                                                          + - = negative, + + = positive
    }

    //Currency update method to add/subtract currency in-game
    //OBS!    playerObj.currencyAmount skal ændres til noget fra db'en
    function currencyCalculator(hand, insurance) {
        //Withdraws the correct amount of money in case the player insures
        if (insurance > 0 && hand.winner == "W") {
            currency += insurance * 2;

        } else if (insurance > 0 && hand.winner != "W") {
            currency -= insurance;
        }
        
        //Withdraws the correct amount of money
        if (hand.winner == "W") {
            currency += hand.bet;
            
        } else if (hand.winner == "L") {
            currency -= hand.bet;
        }
    }

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
        /* response.content = "hold";
        game.hold(playerObj.hands[activeHand]);

        updateResponsePoints();
        response.dealer.cards = game.dealer;
        response.player.cards = playerObj.hands[activeHand].cards;

        response.player.winner = playerObj.hands[activeHand].winner;
        
        send(response);
        updateWinnings(); */
        console.log("Holding fast!");
        game.hold(playerObj.hands[activeHand]);
        if (game.isEveryoneDone())
            announceWinner();
    }

    function announceWinner() {
        console.log("Announced winner");
        if (game.isEveryoneDone()) {
            let response = {type: "blackjack", content: "done", wins: [], dealer: {cards: [], points: 0} };

            for (let i = 0; i < playerObj.hands.length; i++) {
                response.wins.push(playerObj.hands[i].winner);
            }

            response.dealer.cards = game.dealer;
            response.dealer.points = game.getCardsValue(game.dealer);

            send(response);
            updateWinnings();
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
        
        userID = msg.secret;

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