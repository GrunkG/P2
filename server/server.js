const http = require('http');
const webtools = require('./modules/httptools');

const socket = require('websocket');
const mysql = require('mysql');
const bjackMod = require('./modules/blackjack');

let sql = {
    host: "localhost",
    user: "username",
    pass: "password",
    db:   "database"
};

let port = 3000,
    ip = "127.0.0.1",
    acceptedOrigin = `http://${ip}:${port}`;

const pathPublic = "./PublicResources/client/";
const defaultHTML = "demo.html";

class user {
    constructor(connection, index) {
        this.ID = null,
        this.player = null;
        this.connection = connection;
        this.userIndex = index;
    }
};

let activeUsers = [];

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

//Handles all the blackjack game logic
function gamehandler(message) {

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
    activeUsers.push(new user(connection, activeUsers.length-1));

    //Handle incoming messages from connection
    connection.on('message', (message) => {
        if (message.type != "utf8") return;
        
        //Try and convert message to an easy to handle JSON object.
        try { 
            let msg = JSON.parse(message.utf8Data);
            /*console.log(ID);
            if (msg.type == "id") ID = msg.id; */
            if (msg.type == "game") gamehandler(msg);
        } catch (err) { //Wrong type of message, print error.
            console.error(err);
            return;
        }
    });

    //Handle closed connection
    connection.on('close', (connection) => {
        activeUsers.splice()
    });
});