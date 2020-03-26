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

function initGame(msg) {
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
}

function handleHit(msg) {
    let cardObj = msg.obj,
    //Player
    playerCard = cardObj.p,
    newCard = new Card(playerCard.value.toString(), playerCard.suit),
    points = msg.val;
    dealCard(playerTarget, newCard);
    playerDeck.deck.push(newCard)
    playerDeck.update();
    document.getElementById(playerSumTarget).innerHTML = points;
    document.getElementById(remoteSumTarget).innerHTML = points;

    //Dealer
    let dealerCard = cardObj.d;
    points = msg.dval;
    dealCard(dealerTarget, newCard);
    document.getElementById(dealerSumTarget).innerHTML = points;
}

function handleFillDealer(cards, points) {
    for (let i = 0; i < cards.length; i++) {
        let new_card = new Card(cards[i].value.toString(), cards[i].suit);
        dealCard(dealerTarget, new_card); 
    }
    document.getElementById(dealerSumTarget).innerHTML = points;
}

function gameHandler() {
    ws = new WebSocket('ws://localhost:3000/');
    ws.onopen = () => {
        ws.send(JSON.stringify({type: "game", content: "startgame"}));
    }

    ws.onmessage = (message) => {
        try {
            let msg = JSON.parse(message.data),
                cardObj,
                newCard;
            console.log(msg);
            if (msg.type == "blackjack") {
                switch (msg.content) {
                    case "game created":
                        initGame(msg);
                        break;
                    case "card":
                        handleHit(msg);
                        break;
                    case "winner":
                        handleFillDealer(msg.obj.dealer, msg.obj.points);
                        console.log("Winner is: " + ((msg.obj.winner) ? "You" : "Dealer"));
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
    ws.send(JSON.stringify({type: "game", content: "hold"}));
}

function doBet(amount) {
    requestServer(`/game/bet/${amount}`);
}