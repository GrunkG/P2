let gameElement = null;
let playerElement = null;
window.onload = () => {
    initiateGame();
};

function initiateGame() {
    console.log("Test");
    gameElement = document.getElementById("game");
    let startBtn = document.createElement("button");
    startBtn.onclick = () => {requestServer("/game/start/testa")};
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
            playerElement = JSON.parse(html);
            return html; 
        }
    );
}

function handleResponse(res) {

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