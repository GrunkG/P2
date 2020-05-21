function toggleLogin(){
    toggleDisplayNone("login", "grid");
    toggleDisplayNone("blackjack-container", "grid");
    toggleDisplayNone("login-button", "grid");
}

function toggleRegister(){
    toggleDisplayNone("register", "grid");
    toggleDisplayNone("blackjack-container", "grid");
    toggleDisplayNone("login-button", "grid");
}

function hideLoginShowRegister(){
    toggleLogin();
    toggleRegister();
}

function toggleLogout(){
    toggleDisplayNone("login-button", "grid");
    toggleDisplayNone("logout-button", "grid");
}

function login() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    websocket.send( JSON.stringify( {type: "loginsystem", content:"login", user: username, pass: password} ) );
}

function register() {
    let username = document.getElementById("register__username").value;
    let password = document.getElementById("register__password").value;
    let checkbox = document.getElementById("register__checkbox");

    if (checkbox.checked) {
        websocket.send( JSON.stringify( {type: "loginsystem", content:"register", user: username, pass: password} ) );
    }
}

//Log out the player
function logout() {
    
    /*Reset game platform, and prepare it for next login, 
      should the player want to login again.*/
    resetGamePlatform();
    toggleLogout();
    toggleLogin();

    //If the playagain button is shown, hide it.
    let playAgain = document.getElementById("player__play-again").style.display;
    if (playAgain != "none" && game != null)
        game.togglePlayAgain();
    
    //Send the logout request to server.
    let username = document.getElementById("username").value;
    websocket.send( JSON.stringify( {type: "loginsystem", content:"logout", user: username, secret: secret} ) );
    
    //Prepare the login form.
    handleLoginsystem();
    clearForm();
}

function clearForm() {
    //Login
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    //Register
    document.getElementById("register__username").value = "";
    document.getElementById("register__password").value = "";
}

/*Handling the document.onkeypress event
    Current only handling the case of the user pressing enter
*/
function keyHandling(e) {
    e = e || window.event;
    if (e.keyCode == '13') { //User hits ENTER
        //Determine whether login or register is active
        let login = document.getElementById("login").style.display;
        let register = document.getElementById("register").style.display;

        if (login == "grid" && register == "none") {
            let button = document.getElementById("login").getElementsByTagName("input")[2];
            button.click();
        } else if (register == "grid" && login == "none") {
            let button = document.getElementById("register").getElementsByTagName("input")[2]; 
            button.click();
        }
    }
}

/* void handleLoginsystem()
    Handles initial client-server communication to the login system.
        Upon login the different user statistics is set to the specific account, 
        a random secret for that session is generated and should the user not have logged in 
        for the day the daily bonus reward is shown.
*/
function handleLoginsystem() {
    websocket = new WebSocket(`ws://${host}:${port}/`);
    //Handle login response from server
    websocket.onmessage = (message) => { 

        try {
            let msg = JSON.parse(message.data);

            if (msg.type == "login") {
                switch(msg.state) {
                    case "success":
                        document.getElementById("player__info--capital").innerHTML = msg.currency;
                        document.getElementById("player__info--wins").innerHTML = msg.games_won;
                        document.getElementById("player__info--losses").innerHTML = msg.games_lost;
                        document.getElementById("player__info--draws").innerHTML = msg.games_drawn;
                        document.getElementById("player__info--played").innerHTML = msg.games_played;
                        document.getElementById("player__info--currency_won").innerHTML = msg.currency_won;
                        document.getElementById("player__info--currency_lost").innerHTML = msg.currency_lost;
                        document.cookie = "secret = " + msg.identity;
                        secret = msg.identity;

                        initiateGame();
                        toggleLogin();
                        toggleLogout();

                        if (msg.bonus)
                            toggleDailyReward();

                        break;
                    case "zeropassword":
                        document.getElementById("login__container--error").innerHTML = "Password is empty, please provide password.";
                        break;
                    case "noexist":
                        document.getElementById("login__container--error").innerHTML = "Username or password is incorrect.";
                        break;
                }
            } else if (msg.type == "register") {
                switch(msg.state) {
                    case "exists":
                        document.getElementById("register__container--error").innerHTML = "User already exists, try another username.";
                        break;
                    case "zeropassword":
                        document.getElementById("register__container--error").innerHTML = "Password is empty, please provide password.";
                        break;
                    case "success":
                        document.getElementById("login__container--error").innerHTML = "User registered, please login.";
                        toggleLogin();
                        toggleRegister();
                        break;
                }
            }

        } catch (err) {
            console.log(err);
        }

    };

}