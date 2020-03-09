/* Node.js module made for a second semester project on AAU
   Contains functionality for general card game mechanics, along with:
   - SQL Database access for multiplayer accross the internet.
   - Focused Blackjack methods
   - (Planned) Focused Poker methods
*/
module.exports = { //Module start

    cardgame: class cardgame {
        constructor() {}


    },

    blackjack: class blackjack {
        constructor(decks, sqlconnector) {
            this.sqlcon = sqlconnector;
            this.players = [];
            this.dealer = new module.exports.player(1);
            this.decks = decks;
            this.ID = null;
            this.ready = true;
        }
        
        set addPlayer(val) {
            this.players[this.players.length] = val;
            this.updategame();
        }

        set queryHandler(result) {
            if (result != null && result != false) {
                if (this.ID == null && result.insertId > 0) this.ID = result.insertId;

                console.log(`Query returned: \n` + JSON.stringify(result));
            }
        }

        creategame() {
            let query = "INSERT INTO tbl_activegames (players) VALUES (NULL);";
            this.sqlcon.doQuery(query, this);
        }
        endgame() {
            if (!this.hasID) return false;
            let query = `DELETE FROM tbl_activegames WHERE ID = ${this.ID};`
            this.sqlcon.doQuery(query, this);
        }
        updategame() {
            if (!this.hasID) return false;
            let query = `UPDATE tbl_activegames SET players = ${this.players.length} WHERE ID = ${this.ID};`;
            this.sqlcon.doQuery(query, this.queryHandler);
        }
        handleGameRequests(req, res) {
            let command = req.url.split('/');
            if (command[2] == null) {
                    res.StatusCode=404;
                    res.end("\n");
                    return false;
            }

            switch(command[2]) { //Implement a game func
                case "start":
                    let test = {message: "TestMessage"};
                    res.StatusCode=200;
                    res.setHeader('Content-Type', 'application/json');
                    res.write(JSON.stringify(test));
                    res.end('\n');
                    break;
                default:
                        res.StatusCode=404;
                        res.end("\n");
                        return false;
                    break;
            }
        }

        getPlayers() {return this.players}
        hasID() {return (this.ID != null) ? true : false;}
    },

    player: class player {
        constructor(hands) {
            this.hands = hands;
            this.game = null;
        }
        //Spil håndtering
        join_game(bj_game) { 
            this.game = bj_game; 
            bj_game.addPlayer = this;
        }
        get getGameID() {}

        //Kort håndtering
        hit() {}
        hold() {}
        split() {}

    },

    hand: class hand {
        constructor(cards) {
            
        }
    },

    db: class sqlconnector {
        constructor(sqlobj, host, user, pass, database) {
            this.sqlobj = sqlobj;
            this.host = host;
            this.user = user;
            this.pass = pass;
            this.database = database;
        }

        getConnection() {
            return this.sqlobj.createConnection({
                host: this.host,
                user: this.user,
                password: this.pass,
                database: this.database
              });
        }

        doQuery(command, store) {
            let sql = this.getConnection();
            sql.connect((err) => {
                if (err) throw err;
                console.log("Connected to database successfully.");
                sql.query(command, (err, result) => {
                    if (err) throw err;
                    //console.log("SQL QUERY: Result object returned: \n" + JSON.stringify(result));
                    store.queryHandler = result;
                });
            });
        }
    }
}