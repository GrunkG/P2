const playerTarget = "player__card-container",
    playerSumTarget = "player__card-sum",
    dealerTarget = "dealer__card-container",
    dealerSumTarget = "dealer__card-sum";

let websocket = null,
    game = null,
    remoteDecks = [];

let hand = 0;

window.onload = () => {
    initiateGame();
    game = new Game();
    game.addRemotes(1);

    let slider = document.getElementById("player__bet--input");
    let output = document.getElementById("player__bet--amount");
    output.innerHTML = slider.value;

    slider.oninput = function() {
        let output = document.getElementById("player__bet--amount");
        output.innerHTML = this.value;
    }
};

function initiateGame() {
    //playerDeck.cardFront = "Simple Black";
    gameHandler();
}

function dealCard(target, card, visible = true) {
    if (visible)
        card.printCardById(target);
    else
        card.printCardFaceDown(document.getElementById(target));
}

function handleHit(msg) {
    /* let player = msg.player;
    let card = player.cards,
        new_card = new Card(card.val.toString(), card.suit);
            
    dealCard(playerTarget, new_card);
    playerDeck.deck.push(new_card)
    playerDeck.update();
    document.getElementById(playerSumTarget).innerHTML = player.points;
    document.getElementById(remoteSumTarget).innerHTML = player.points; */
    //Currently sending all cards at a time, rather than just 1 card.
    handleCards(msg);
}

function handleCards(msg) {
    clearCardHolders();

    //Player
    let player = msg.player;
    for (let i = 0; i < player.cards.length; i++) {
        let card = player.cards[i],
            new_card = new Card(card.val.toString(), card.suit);
            
        dealCard(playerTarget, new_card);
        //playerDeck.deck.push(new_card)
    }
    //playerDeck.update();
    document.getElementById(playerSumTarget).innerHTML = player.points;

    //Dealer
    let dealer = msg.dealer;
    for (i = 0; i < dealer.cards.length; i++) {
        let card = dealer.cards[i],
            new_card = new Card(card.val.toString(), card.suit),
            visible = card.visible;
        if (visible)
            dealCard(dealerTarget, new_card);
        else
            dealCard(dealerTarget, new_card, visible);
    }
    document.getElementById(dealerSumTarget).innerHTML = dealer.points;
}

function handleWinner(msg) {
    clearCardHolders();
    if (msg.winner == "D")
        console.log("Winner: Draw");
    else
        console.log("Winner is: " + ((msg.winner == "W") ? "You" : "Dealer"));
        
    handleCards(msg);
} 

function clearCardHolders() {
    document.getElementById("player__card-container").innerHTML = "";
    document.getElementById("dealer__card-container").innerHTML = "";
}

//W.I.P - Still missing additional hands handling on client-side.
function updateGame(msg) {
    //Add new remote players if necessary
    let remote_players = document.getElementsByClassName("remote-player");
    let players = msg.players;
    let difference = remote_players.length - players.length;
    
    //If the difference is greater than 0
    if (Math.abs(difference) > 0)
        game.addRemotes(Math.abs(difference));

    //For each active player
    for (let i = 0; i < players.length; i++) {
        let remote_deck = remoteDecks[i],
            player = players[i],
            remote_id = "remote-player-p" + (i+1);
            console.log(remote_id);
        //Clean up remote deck for new cards
        remote_deck = new Deck([]);

        //For each active player hand
        for (let x = 0; x < player.hands.length; x++) {
            let hand = player.hands[x];

            //-> Add hand cards to a hand element for each separat hand
            for (let y = 0; y < hand.cards.length; y++) {
                let card = hand.cards[y];
                let new_card = new Card(card.val.toString(), card.suit);
                //Currently only handling the first hand, needs further client-side hand visualization.
                if (x > 0)
                    continue;

                remote_deck.cards.push(new_card);
            }
        }

        //Update the shown cards
        remote_deck.update(remote_id);
    }
}

function gameHandler() {
    //                        ws = websocket
    websocket = new WebSocket('ws://localhost:3000/');
    websocket.onopen = () => {
        websocket.send(JSON.stringify({type: "game", content: "startgame"}));
    }

    websocket.onmessage = (message) => {
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
                        handleSplit(msg);
                        break;
                    case "winner":
                        handleWinner(msg);
                    case "done":
                        break;
                    case "update":
                        updateGame(msg);
                        break;
                }
            }
        } catch (err) {
            console.log(err);
        }
        
    }
}

function doHit() {
    websocket.send(JSON.stringify({type: "game", content: "hit"}));
}
function doHold() {
    websocket.send(JSON.stringify({type: "game", content: "hold"}));
}
function doDouble() {
    websocket.send(JSON.stringify({type: "game", content: "double"}));
}
function doSplit() {
    websocket.send(JSON.stringify({type: "game", content: "split"}));
}
function doInsure() {
    websocket.send(JSON.stringify({type: "game", content: "insure"}));
}

function doBet() {
    let input = document.getElementById("player__bet--input");
    let value = parseInt(input.value);

    websocket.send(JSON.stringify({type: "game", content: "bet", amount: value}));
}