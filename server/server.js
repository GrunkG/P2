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
        playerObj;

    function initGame() {
        for (let i = 1; i <= 3; i++) {
            let drawn_card = thisUser.playerObj.activeGame.drawCard();
            if (i%2 == 1)
                thisUser.playerObj.hands[0].grab(drawn_card);
            else
                thisUser.playerObj.activeGame.dealer.push(drawn_card);
        }
    }

    function handleHit() {
        //Player
        let p_card = thisUser.playerObj.activeGame.drawCard(), points;
        thisUser.playerObj.hands[0].grab(p_card);
        points = thisUser.playerObj.getHandValue(0);

        //Dealer
        let d_card = thisUser.playerObj.activeGame.drawCard(), dpoints;
        dpoints = thisUser.playerObj.activeGame.getCardsValue(thisUser.playerObj.activeGame.dealer);
        
        if (dpoints >= 21 || points >= 21)
            handleHold();

        send({type: "blackjack", content: "card", obj: {p: p_card, d:d_card}, val: points, dval: dpoints});
    }

    function handleHold() {
        points = thisUser.playerObj.getHandValue(0);
        fillDealer();
        let win = thisUser.playerObj.activeGame.determineWin(points)
        dpoints = thisUser.playerObj.activeGame.getCardsValue(thisUser.playerObj.activeGame.dealer);
        send({type: "blackjack", content: "winner", obj: {winner: win, dealer: thisUser.playerObj.activeGame.dealer, points:dpoints}});
    }

    function fillDealer() {
        let dealer = thisUser.playerObj.activeGame.dealer;
        let points = thisUser.playerObj.activeGame.getCardsValue(dealer);
        while (points < 17) {
            let drawn_card = thisUser.playerObj.activeGame.drawCard();
            thisUser.playerObj.activeGame.dealer.push(drawn_card);
            points = thisUser.playerObj.activeGame.getCardsValue(dealer);
        }
    }

    //Handles all the blackjack game logic
    function gamehandler(message) {
        switch(message.content) {
            case "startgame":
                let new_game = new bjackGame().startGame(4, false);
                thisUser.playerObj =  new cardgame.player(1);
                thisUser.playerObj.joinGame(new_game);
                activeGames.push(new_game);
                initGame();
                send({type: "blackjack", content: "game created", cards: thisUser.playerObj.hands[0].getHold(), 
                        dealer: thisUser.playerObj.activeGame.dealer, pPoints: thisUser.playerObj.getHandValue(0),
                        dPoints: thisUser.playerObj.activeGame.getCardsValue(thisUser.playerObj.activeGame.dealer) });
                break;
            case "hit":
                handleHit();
                break;
            case "hold":
                handleHold()
                break;
            case "double":
                break;
            case "split":
                break;
            case "insurance":
                break;
            default:  break;
        }
    }

    function send(message) {
        connection.send( JSON.stringify(message) );
    }

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
});