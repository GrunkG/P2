const fs = require('fs');
const http = require('http');
const path=require("path");

/* Node.js module made for a second semester project on AAU
   Contains functionality to quickly setup a Node.js http server and other useful functionality 
   when working with a http server. */
module.exports = {
    server: class httpserv {
        constructor(host, port, homefile, resourcePath) {
            this.host = host;
            this.port = port;
            this.home = homefile;
            this.resourcePath = resourcePath;
            this.server = null;
        }
        launchServer(callback) {
            this.server = http.createServer(callback);
            this.server.listen(this.port, this.host, () => {
                let d = new Date()
                console.log(`[${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}] > Server listening at http://${this.host}:${this.port}.`);
            });
        }

        handleGET(req, res) {
            switch(req.url) {
                case "/":
                    this.fileResponse(this.home, res);
                    break;
                default:
                    this.fileResponse(req.url, res);
                    break;
            }
        }
        handlePOST(req, res) {}

        //Shamelessly stolen from Lecture 5 Exercises solution 
        fileResponse(filename,res){
            const sPath=this.securePath(filename);
            //console.log("Reading: "+sPath);
            fs.readFile(sPath, (err, data) => {
              if (err) {
                console.error(err);
                res.statusCode=404;
                res.setHeader('Content-Type', 'text/txt');
                res.write("File Error:"+String(err));
                res.end("\n");
              }else {
                res.statusCode = 200;
                res.setHeader('Content-Type', this.guessMimeType(filename));
                res.write(data);
                res.end('\n');
              }
            })
          }
          //Shamelessly stolen from Lecture 5 Exercises solution 
          guessMimeType(fileName){
            const fileExtension=fileName.split('.').pop().toLowerCase();
            //console.log(fileExtension);
            const ext2Mime ={ //Aught to check with IANA spec
              "txt": "text/txt",
              "html": "text/html",
              "ico": "image/ico", // CHECK x-icon vs image/vnd.microsoft.icon
              "js": "text/javascript",
              "json": "application/json", 
              "css": 'text/css',
              "png": 'image/png',
              "jpg": 'image/jpeg',
              "wav": 'audio/wav',
              "mp3": 'audio/mpeg',
              "svg": 'image/svg+xml',
              "pdf": 'application/pdf',
              "doc": 'application/msword',
              "docx": 'application/msword'
             };
              //incomplete
            return (ext2Mime[fileExtension]||"text/plain");
          }
          //Shamelessly stolen from Lecture 5 Exercises solution 
          securePath(userPath){
            if (userPath.indexOf('\0') !== -1) {
              // could also test for illegal chars: if (!/^[a-z0-9]+$/.test(filename)) {return undefined;}
              return undefined;
          
            }
            userPath= this.resourcePath+userPath;
            const rootFileSystem=process.cwd();
            let p= path.join(rootFileSystem,path.normalize(userPath)); 
            //console.log("The path is:"+p);
            return p;
          }
    }
};