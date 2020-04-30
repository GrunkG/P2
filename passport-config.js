const LocalStrategy = require("passport-local").Strategy //Gets strategy class for passport

//Database setup
const mysql = require("mysql");
const dbConfig = require("./server/dbConfig.js")
const connection = mysql.createConnection(dbConfig);
connection.query("USE P2");

const bcrypt = require("bcrypt-nodejs"); //Used for cryptation

function initialize(passport){
    //A function passport needs for login
    passport.serializeUser((user, done) => done(null, user.ID)); 

    //A function passport needs for logout
    passport.deserializeUser((id, done) => {
        connection.query("SELECT * from account WHERE ID = ? ", [id], (error, rows) => {
            done(error, rows[0]);
        });
    });

    //Register
    passport.use("local-register", new LocalStrategy({ 
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true },
        registerUser) //<--- This is the register function - See below
    );

    //Login
    passport.use("local-login", new LocalStrategy({
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true },
        loginUser) //<--- This is the login function - See below
    );
}

//Handles the registration process
const registerUser = function (request, username, password, done) {
    connection.query("SELECT * FROM account WHERE username = ? ", [username], (error, rows) => {
        if (error) {
            return done(error);
        } else if (rows.length) { //rows.length == true when a username is taken
            return done(null, false, request.flash("registerMessage", "Username already exists"));
        } else { //Create new user as object
            let newUser = {
                username: username,
                password: bcrypt.hashSync(password, null, null)
            };

            //Insert new user into database
            let insertQuery = "INSERT INTO account (username, password) VALUES (?, ?)";
            connection.query(insertQuery, [newUser.username, newUser.password], (error, rows) => {
                newUser.ID = rows.insertId; //Add ID to the user object

                return done(null, newUser);
            });
        }
    });
}

//Handles the login process
const loginUser = function (request, username, password, done) {
    connection.query("SELECT * FROM account WHERE username = ? ", [username], (error, rows) => {
        if (error) {
            return done(error);
        } else if (!rows.length) { //rows.length == false when a username does not exist in the database
            return done(null, false, request.flash("loginMessage", "User not found"));
        } else if (!bcrypt.compareSync(password, rows[0].password)){ //If the submitted password does not match the encrypted password
            return done(null, false, request.flash("loginMessage", "Incorrect password"));
        } else { //If the submitted password does match the encrypted password
            return done(null, rows[0]);
        }
    });
}

module.exports = initialize;