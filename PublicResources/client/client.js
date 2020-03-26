let gameElement = null;
let playerElement = null;
let ws = null;
window.onload = () => {
    initiateGame();
};

function initiateGame() {
    console.log("Test");
    gameElement = document.getElementById("game");
    let startBtn = document.createElement("button");
    startBtn.onclick = () => {gameHandler();};
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



function gameHandler() {
    ws = new WebSocket('ws://localhost:3000/');
    ws.onopen = () => {
        ws.send(JSON.stringify({type: "game", content: "startgame"}));
    }

    ws.onmessage = (msg) => {
        console.log(JSON.parse(msg.data));
    }
}

function doHit() {
    ws.send(JSON.stringify({type: "game", content: "hit"}));
}

function doHold() {
    requestServer("/game/hold");
}

function doBet(amount) {
    requestServer(`/game/bet/${amount}`);
}