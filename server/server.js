const http = require('http');
const webtools = require('./modules/httptools');

const socket = require('websocket');
const mysql = require('mysql');
const cardgame = require('./modules/cards_foundation');
const bjackGame = require('./modules/blackjack');

let sql = {
    host: "localhost",
    user: "username",
    pass: "password",
    db:   "database"
};

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
activeGames.push(new bjackGame());

//########  Webserver
const webserv = http.createServer((req, res) => {
    let method = req.method;
    if (method == "GET") {
        switch(req.url) {
            case "/":
                webtools.fileResponse(defaultHTML, pathPublic, res)
                break;
            default:
                webtools.fileResponse(req.url, pathPublic, res)
                break;
        }
    }

    if (method == "POST") {

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

    //Handles all the blackjack game logic
    function gamehandler(message) {
        switch(message.content) {
            case "startgame":
                activeGames[0] = new bjackGame(); //Temp - Allows easy new games
                playerObj.join(activeGames[0]);
                game = playerObj.game;
                initGame();
                break;
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
    }

    function updateResponsePoints() {
        response.player.points = game.getCardsValue(playerObj.hands[activeHand].cards);
        response.dealer.points = game.getCardsValue(game.dealer);
        response.bet = playerObj.hands[activeHand].bet;
        response.player.hand = activeHand;
    }

    function initGame() {
        game.initialize(4);

        response.content = "game created";
        response.player.cards = playerObj.hands[activeHand].cards;
        response.dealer.cards = game.dealer;
        updateResponsePoints();
        send(response);
    }

    function handleHit() {
        response.content = "card";
        game.hit(playerObj.hands[activeHand]);
        response.player.cards = playerObj.hands[activeHand].cards;
        
        updateResponsePoints();
        send(response);

        if (response.player.points >= 21) {
            handleHold();
        }

        if (playerObj.hands.length > 1 && activeHand != (playerObj.hand.length -1 ) )
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

        game.determineWinner();
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
            response.content = "card";
            response.player.cards = playerObj.hands[activeHand].cards;
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