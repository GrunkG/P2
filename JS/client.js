const playerTarget = "player__card-container",
    playerSumTarget = "player__card-sum",
    remoteSumTarget = "remote-player-p1__card-sum",
    dealerTarget = "dealer__card-container",
    dealerSumTarget = "dealer__card-sum";

let ws = null,
    playerDeck = new Deck([], "remote-player-p1__card-container");
window.onload = () => {
    initiateGame();
};

function initiateGame() {
    playerDeck.cardFront = "Simple Black";
    gameHandler();
}

function dealCard(target, card) {
    card.printCardById(target);
}

function gameHandler() {
    ws = new WebSocket('ws://localhost:3000/');
    ws.onopen = () => {
        ws.send(JSON.stringify({type: "game", content: "startgame"}));
    }

    ws.onmessage = (message) => {
        try {
            let msg = JSON.parse(message.data),
                cardObj;
            console.log(msg);
            if (msg.type == "game") {
                switch (msg.content) {
                    case "game created":
                        let newCard = null
                        for (let i = 0; i < msg.cards.length; i++) {
                            cardObj = msg.cards[i];
                            newCard = new Card(cardObj.value.toString(), cardObj.suit);
                            dealCard(playerTarget, new Card(cardObj.value.toString(), cardObj.suit));
                            playerDeck.deck.push(newCard);
                        }
                        for (i = 0; i < msg.dealer.length; i++) {
                            cardObj = msg.dealer[i];
                            newCard = new Card(cardObj.value.toString(), cardObj.suit);
                            dealCard(dealerTarget, new Card(cardObj.value.toString(), cardObj.suit));
                        }
                        playerDeck.update();
                        document.getElementById(playerSumTarget).innerHTML = msg.pPoints;
                        document.getElementById(dealerSumTarget).innerHTML = msg.dPoints;
                        document.getElementById(remoteSumTarget).innerHTML = msg.pPoints;
                        break;
                    case "card":
                        cardObj = msg.obj;
                        dealCard(playerTarget, new Card(cardObj.value.toString(), cardObj.suit));
                        break;
                    case "dealer-card":
                        cardObj = msg.obj;
                        dealCard(dealerTarget, new Card(cardObj.value.toString(), cardObj.suit));
                        break;
                    case "done":
                        break;
                }
            }
        } catch (err) {
            console.log(err);
        }
        
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