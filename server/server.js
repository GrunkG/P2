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
        playerObj,
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
                let new_game = new bjackGame().startGame(4, false);
                thisUser.playerObj =  new cardgame.player(1);
                thisUser.playerObj.joinGame(new_game);
                activeGames.push(new_game);

                game = thisUser.playerObj.activeGame;
                playerObj =thisUser.playerObj; 

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
            case "insurance":
                handleInsurance();
                break;
            default:  break;
        }
    }

    function updateResponsePoints() {
        response.player.points = playerObj.getHandValue(activeHand);
        response.dealer.points = game.getCardsValue(game.dealer);
        response.bet = playerObj.bet[activeHand];
        response.player.hand = activeHand;
    }

    function initGame() {
        for (let i = 1; i <= 3; i++) {
            let drawn_card = game.drawCard();
            if (i%2 == 1)
                playerObj.hands[0].grab(drawn_card);
            else
                game.dealer.push(drawn_card);
        }

        response.content = "game created";
        response.player.cards = playerObj.hands[0].getHold();
        response.dealer.cards = game.dealer;
        updateResponsePoints();
        send(response);
    }

    function handleHit() {
        //Player
        let card = game.drawCard();
        playerObj.hands[activeHand].grab(card);
        response.player.cards = card;

        //Dealer
        card = game.drawCard()
        game.dealer.push(card);
        response.dealer.cards = card;
        
        updateResponsePoints();
        if (response.dealer.points >= 21 || response.player.points >= 21)
            handleHold();

        response.content = "card";
        send(response);

        if (playerObj.hands.length > 1 && activeHand != (playerObj.hand.length -1 ) )
            activeHand++;
        else
            activeHand = 0;
    }

    function handleHold() {
        response.content = "winner";
        fillDealer();

        updateResponsePoints();
        response.dealer.cards = game.dealer;
        response.player.cards = playerObj.hands[activeHand].getHold();

        let win = game.determineWin(response.player.points)
        response.win = win;

        send(response);
    }

    function fillDealer() {
        let dealerCards = game.dealer;
        let points = game.getCardsValue(dealerCards);
        while (points < 17) {
            let drawn_card = game.drawCard();
            game.dealer.push(drawn_card);
            points = game.getCardsValue(dealerCards);
        }
    }
    function handleDouble() {
        let hand = playerObj.hands[activeHand];
        if (hand.length == 2) {
            let card = game.drawCard();
            hand.grab(card);
            playerObj.bet[activeHand] *= 2;
            handleHold();
        }
    }
    function handleSplit() {
        let hand = playerObj.hands[activeHand],
            cards = hand.getHold();

        if (cards[0] == cards[1]) {
            playerObj.hands[playerObj.hands.length] = cards.shift();
            playerObj.bet[playerObj.hands.length] = playerObj.bet[activeHand];
        }
    }
    function handleInsurance() {

    }

    function send(message) {
        connection.send( JSON.stringify(message) );
    }

    
});