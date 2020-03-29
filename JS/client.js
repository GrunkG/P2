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

function handleHit(msg) {
    //Player
    let player = msg.player;
    let card = player.cards,
        new_card = new Card(card.value.toString(), card.suit);
            
    dealCard(playerTarget, new_card);
    playerDeck.deck.push(new_card)
    playerDeck.update();
    document.getElementById(playerSumTarget).innerHTML = player.points;
    document.getElementById(remoteSumTarget).innerHTML = player.points;

    //Dealer
    let dealer = msg.dealer;
    card = dealer.cards;
    new_card = new Card(card.value.toString(), card.suit);
    dealCard(dealerTarget, new_card);
    document.getElementById(dealerSumTarget).innerHTML = dealer.points;
}

function handleCards(msg) {
    //Player
    let player = msg.player;
    for (let i = 0; i < player.cards.length; i++) {
        let card = player.cards[i],
            new_card = new Card(card.value.toString(), card.suit);
            
        dealCard(playerTarget, new_card);
        playerDeck.deck.push(new_card)
    }
    playerDeck.update();
    document.getElementById(playerSumTarget).innerHTML = player.points;
    document.getElementById(remoteSumTarget).innerHTML = player.points;

    //Dealer
    let dealer = msg.dealer;
    for (i = 0; i < dealer.cards.length; i++) {
        let card = dealer.cards[i],
            new_card = new Card(card.value.toString(), card.suit);

        dealCard(dealerTarget, new_card);
    }
    document.getElementById(dealerSumTarget).innerHTML = dealer.points;
}

function handleWinner(msg) {
    clearCardsHolders();
    handleCards(msg);
} 

function clearCardsHolders() {
    document.getElementById("player__card-container").innerHTML = "";
    document.getElementById("dealer__card-container").innerHTML = "";
    playerDeck.deck = [];
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
                        handleCards(msg);
                        break;
                    case "card":
                        handleHit(msg);
                        break;
                    case "split":
                        break;
                    case "winner":
                        handleWinner(msg);
                        console.log("Winner is: " + ((msg.win) ? "You" : "Dealer"));
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
function doDouble() {
    ws.send(JSON.stringify({type: "game", content: "double"}));
}
function doSplit() {
    ws.send(JSON.stringify({type: "game", content: "split"}));
}
function doInsure() {
    ws.send(JSON.stringify({type: "game", content: "insure"}));
}

function doBet(amount) {
    requestServer(`/game/bet/${amount}`);
}