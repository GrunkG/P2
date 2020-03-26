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

    let thisUser = new user(connection);

    function initGame() {
        for (let i = 1; i <= 4; i++) {
            let drawn_card = thisUser.playerObj.activeGame.drawCard();
            if (i%2 == 1)
                thisUser.playerObj.hands[0].grab(drawn_card);
            else
                thisUser.playerObj.activeGame.dealer.push(drawn_card);
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
                send({type: "game", content: "game created", cards: thisUser.playerObj.hands[0].getHold(), 
                        dealer: thisUser.playerObj.activeGame.dealer, pPoints: thisUser.playerObj.getHandValue(0),
                        dPoints: thisUser.playerObj.activeGame.getCardsValue(thisUser.playerObj.activeGame.dealer) });
                break;
            case "hit":
                let drawn_card = thisUser.playerObj.activeGame.drawCard();
                thisUser.playerObj.hands[0].grab(drawn_card);
                //let cardval = thisUser.playerObj.getHandValue(0);
                send({type: "game", content: "card", obj: drawn_card, val: 5});
                break;
            case "hold":
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