class sqltools {
    constructor(sqlobj) {
        this.sqlobj = sqlobj;
        this.host = sqlobj.host;
        this.user = sqlobj.user;
        this.pass = sqlobj.pass;
        this.database = sqlobj.db;
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