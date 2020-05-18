//Id = id of element in html, toggles display between "none" and the input display
function toggleDisplayNone(id, display){
    let element = document.getElementById(id);
    if (element.style.display === "none") {
        element.style.display = display;
    } else {
        element.style.display = "none";
    }
}

// function toggleBodyFormOpen(){
//     if (document.body.classList.contains("form-open")) {
//         document.body.classList.remove("form-open");
//     } else {
//         document.body.classList.add("form-open");
//     }
// }

function writeLoginError(error){
    document.getElementById("login__container--error").innerHTML = error;
}

function writeRegisterError(error){
    document.getElementById("register__container--error").innerHTML = error;
}

function toggleDailyReward(){
    toggleDisplayNone("daily-reward", "grid");
}

function setCountdown(seconds){
    let countdownNumber = document.getElementById("countdown__number");
    let countdownStroke = document.getElementById("countdown__stroke");
    let countdown = seconds;

    toggleDisplayNone("countdown", "block");
    countdownStroke.style.animation = `countdown ${seconds}s linear infinite forwards`;
    countdownNumber.innerHTML = countdown;

    let countInterval = setInterval(() => { //Counts down countdown by 1 every second
    countdown--;
    countdownNumber.innerHTML = countdown;
    }, 1000); //1 second

    setTimeout(() => { //Hides the container after the countdown
        toggleDisplayNone("countdown", "block");
        clearInterval(countInterval);
    }, seconds * 1000);
}