let mysql = require('mysql');
class sqltools {
    constructor(info) {
        this.sqlobj = mysql;
        this.host = info.host;
        this.user = info.user;
        this.pass = info.pass;
        this.database = info.db;
    }

    makeConnection() {
        return this.sqlobj.createConnection({
            host: this.host,
            user: this.user,
            password: this.pass,
            database: this.database
          });
    }

    doQuery(command, store) {
        let sql = this.makeConnection();
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

module.exports = sqltools;