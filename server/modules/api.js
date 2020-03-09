/* Node.js module made for a second semester project on AAU
   Contains functionality for general card game mechanics, along with:
   - SQL Database access for multiplayer accross the internet.
   - Focused Blackjack methods
   - (Planned) Focused Poker methods
*/

//RE-WRITTING

module.exports = { //Module start

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

