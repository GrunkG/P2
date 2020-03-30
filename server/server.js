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

    //Accept connection and start handling events
    let connection = req.accept(null, req.origin);
    console.log("Connection accepted from origin: " + req.origin);

    let thisUser = new user(connection),
        game,
        playerObj = new cardgame.Player(),
        response = {type: "blackjack", content: "", player: {hand: 0, cards: [], points: 0}, 
                    dealer: {cards: [], points: 0}, win: null, bet: 0},
        activeHand = 0;

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
    });

    //Handles all the blackjack game logic
    function gamehandler(message) {
        switch(message.content) {
            case "startgame":
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
                console.log("Hmm");
                handleDouble();
                break;
            case "split":
                handleSplit();
                break;
            case "insurance":
                handleInsurance();
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
        response.player.cards = game.hit(playerObj.hands[activeHand]);
        
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
        game.fillDealer(response.dealer.points);

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

    function handleSplit() {
        let hand = playerObj.hands[activeHand];
        game.split(playerObj, hand);
        //Re-think the response element to handle splitting
    }

    function handleInsurance() {
        game.insurance(playerObj);
    }

    function send(message) {
        connection.send( JSON.stringify(message) );
    }

    
});