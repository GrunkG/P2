const express = require("express");
const session = require("express-session");
//const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");

const passport = require("passport");
const initializePassport = require("./passport-config.js");
initializePassport(passport);

const PORT = 3000;

const app = express(); //Creates express server

//Lets the server use the session package
app.use(session({ 
    secret: "secret",
    resave: true,
    saveUninitialized: true
}));

//app.use(bodyParser.urlencoded({extended: true})); //Lets the server use bodyParser
app.use(express.urlencoded());
app.use(cookieParser()); //Lets the server use cookieParser
app.use(flash()); //Lets the server use express-flash

//Lets the server use passport
app.use(passport.initialize());
app.use(passport.session());

//Gives the client static files e.g. css and images
app.use("/Style", express.static(__dirname + '/Style'));
app.use("/Resources", express.static(__dirname + '/Resources'));
app.use("/JS", express.static(__dirname + '/JS'));

//Makes the server use ejs files from the views folder
app.set("view-engine", "ejs"); 


//---------- ROUTING ------------

//Homepage
app.get("/", isLoggedIn, (request, response) => {
    response.render("blackjack.ejs");
})
//Other pages
app.get("/login", isNotLoggedIn, (request, response) => {
    response.render("login.ejs", {message:request.flash("loginMessage")});
})
app.get("/register", isNotLoggedIn, (request, response) => {
    response.render("register.ejs", {message:request.flash("registerMessage")});
})

//Login handler
app.post("/login", passport.authenticate("local-login", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true}), (request, response) => {
        console.log(request.body.remember); //This part does not currently do anything
        if (request.body.remember) { //Cookie to remember login
            request.session.cookie.age = 30 * 24 * 60 * 60 * 1000; //Cookie max age of 30 days
        } else {
            request.session.cookie.expires = false; //Cookie expires at end of session
        }
        response.redirect("/");
    }
);

//Register handler
app.post("/register", passport.authenticate("local-register", {
    successRedirect: "/",
    failureRedirect: "/register",
    failureFlash: true
}));

//Logout
app.get("/logout", (request, response) => {
    request.logout();
    response.redirect("/login");
})

//---------- END OF ROUTING ------------

//Redirects user that are not logged in to the login page
function isLoggedIn(request, response, next) { 
    if (request.isAuthenticated()) {
        return next();
    }
    response.redirect("/login");
}

//Redirects user that are logged in to the home page
function isNotLoggedIn(request, response, next) { 
    if (request.isAuthenticated()) {
        return response.redirect("/");
    }
    next();
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));