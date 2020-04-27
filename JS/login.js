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
    //Check if login is correct
    //Log in the player
    //Hide login and show log out button
    toggleLogin();
    toggleLogout();
}

function register(){
    //Check if username exists
    //Register the user
    toggleRegister();
}

function logout(){
    //Log out the player
    //Hide log out button and show log in button
    toggleLogout();
}