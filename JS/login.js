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

function login(){
    //Check if login is correct -- Server
    //Log in the player
    //Hide login and show log out button

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    websocket.send( JSON.stringify( {type: "loginsystem", content:"login", user: username, pass: password} ) );

    //toggleLogin();
    //toggleLogout();
}

function register(){
    //Check if username exists
    //Register the user

    let username = document.getElementById("register__username").value;
    let password = document.getElementById("register__password").value;

    websocket.send( JSON.stringify( {type: "loginsystem", content:"register", user: username, pass: password} ) );

    //toggleRegister();
}

function logout(){
    //Log out the player
    //Hide log out button and show log in button
    resetGamePlatform();
    toggleLogout();
    toggleLogin();
    let username = document.getElementById("username").value;

    websocket.send( JSON.stringify( {type: "loginsystem", content:"logout", user: username, secret: getCookie("secret")} ) );
    handleLoginsystem();
    clearForm();
    //document.location.reload();
}

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
            //Will change when 2nd password field is added [2] -> [3]
            let button = document.getElementById("register").getElementsByTagName("input")[2]; 
            button.click();
        }
    }
}

function clearForm() {
    //Login
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    //Register
    document.getElementById("register__username").value = "";
    document.getElementById("register__password").value = "";
}

function handleLoginsystem() {
    websocket = new WebSocket(`ws://${host}:${port}/`);
    //Handle login response from server
    websocket.onmessage = (message) => { 

        try {
            let msg = JSON.parse(message.data);

            if (msg.type == "login") {
                switch(msg.state) {
                    case "success":
                        console.log("Was in login!");
                        //toggleLogin();
                        document.getElementById("player__info--capital").innerHTML = msg.currency;
                        document.getElementById("player__info--wins").innerHTML = msg.games_won;
                        document.getElementById("player__info--losses").innerHTML = msg.games_lost;
                        document.getElementById("player__info--draws").innerHTML = msg.games_drawn;
                        document.getElementById("player__info--played").innerHTML = msg.games_played;
                        document.cookie = "secret = " + msg.identity;

                        initiateGame();
                        toggleLogin();
                        toggleLogout();
                        break;
                    case "zeropassword":
                        document.getElementById("login__container--error").innerHTML = "Password is empty, please provide password.";
                        break;
                    case "noexist":
                        document.getElementById("login__container--error").innerHTML = "Username or password is incorrect.";
                        break;
                }
            } else if (msg.type == "register") {
                //register__container--error
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