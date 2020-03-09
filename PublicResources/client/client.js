let gameElement = null;
window.onload = () => {
    initiateGame();
};

function initiateGame() {
    console.log("Test");
    gameElement = document.getElementById("game");
    let startBtn = document.createElement("button");
    startBtn.onclick = () => {requestServer("/game/start")};
    startBtn.id = "startBtn";
    startBtn.innerHTML = "START"
    gameElement.appendChild(startBtn);
}

function requestServer(url) {
    fetch(url)
    .then(
        response => response.text() // .json(), etc.
        // same as function(response) {return response.text();}
    ).then(
        html => { 
            console.log(html);
            return html; 
        }
    );
}

function doHit() {
    requestServer("/game/hit");
}

function doHold() {
    requestServer("/game/hold");
}

function doBet(amount) {
    requestServer(`/game/bet/${amount}`);
}