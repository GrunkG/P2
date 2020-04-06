function toggleLogin(){
    toggleDisplayNone("login", "grid");
}

function toggleRegister(){
    toggleDisplayNone("register", "grid");
}

function hideLoginShowRegister(){
    toggleLogin();
    toggleRegister();
}

function showLogout(){
    toggleDisplayNone("login-button", "grid");
    toggleDisplayNone("logout-button", "grid");
}

//toggleDisplayNone("login", "grid");

