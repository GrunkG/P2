//requires
const httptools = require('./modules/httptools');
const http = require('http');

//Global variables
const pathPublic = "./PublicResources/client/";
const defaultHTML = "demo.html";
const serverinfo = {ip: '127.0.0.1', port: 3000};

//Objects
let tools = new httptools(pathPublic);

let sql = {
    host: "localhost",
    user: "username",
    pass: "password",
    db:   "database"
};

class user {
    constructor(name, secret) {
        this.name = name,
        this.secret = secret,
        this.action = null;
    }
}

//Establish server
let server = http.createServer((req, res) => {
    let method = req.method;
    switch (method) {
        case "GET":
            let url = req.url;
            if (url == "/") tools.fileResponse(defaultHTML, res);
            tools.fileResponse(url, res);
            break;
        //case "POST":
        default:
            res.statusCode=404;
            res.end("\n");
            break;
    }
} );

server.listen(serverinfo.port, serverinfo.ip, () => {
    //let d = new Date();
   // console.log(`[${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}] > Server listening at http://${serverinfo.ip}:${serverinfo.port}/`);
});

//Handle requests from client
