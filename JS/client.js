const playerTarget = "player__card-container",
    playerSumTarget = "player__card-sum0",
    dealerTarget = "dealer__card-container",
    dealerSumTarget = "dealer__card-sum";

let game = null,
    remoteDecks = [];

let hand = 0,
    handBets = [];

window.onload = () => {
    //initiateGame();
    let slider = document.getElementById("player__bet--input");
    let output = document.getElementById("player__bet--amount");
    output.innerHTML = slider.value;

    slider.oninput = function() {
        let output = document.getElementById("player__bet--amount");
        output.innerHTML = this.value;
    }

    toggleLogin();
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
    //clearCardHolders();

    //Player
    let player = msg.player,
        playerDeck = new Deck([]);
    
    handBets[player.hand] = player.bet;

    for (let i = 0; i < player.cards.length; i++) {
        let card = player.cards[i],
            new_card = new Card(card.val.toString(), card.suit);
            
        playerDeck.cards.push(new_card);
    }
    game.player.hands[player.hand] = playerDeck;
    document.getElementById(playerSumTarget).innerHTML = player.points;

    //Update dealer cards
    updateDealer(msg);

    updateTotalBet(player.insurance);
    game.updateScreen();
}

function updateDealer(msg) {
    //Dealer
    let dealer = msg.dealer,
        dealerDeck = new Deck([]);
    for (i = 0; i < dealer.cards.length; i++) {
        let card = dealer.cards[i],
            new_card = new Card(card.val.toString(), card.suit),
            visible = card.visible;

        if (visible) {
           dealerDeck.cards.push(new_card);
        }

    }

    game.dealer.hands[0] = dealerDeck;
    document.getElementById(dealerSumTarget).innerHTML = dealer.points;
}

function updateTotalBet(insurance = 0) {
    let total = 0;
    for (let i = 0; i < handBets.length; i++) {
        total += handBets[i];
    }

    total += insurance;

    document.getElementById("player__info--bet").innerHTML = total;
} 

function handleSplit(msg) {
    game.player.splitHand(msg.player.hand);
}

function clearCardHolders() {
    document.getElementById("player__card-container").innerHTML = "";
    document.getElementById("dealer__card-container0").innerHTML = "";
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
                
                updateHand(hand, x);

                remote_deck.cards.push(new_card);
            }
        }

        //Update the shown cards
        remote_deck.update(remote_id);
    }
    game.updateScreen();
}

function updateHand(hand, index) {
    let deck = new Deck([]);

    for (let i = 0; i < hand.cards.length; i++) {
        let card = hand.cards[i],
            new_card = new Card(card.val.toString(), card.suit);
            
            deck.cards.push(new_card);
    }
    game.player.hands[index] = deck;
    document.getElementById("player__card-sum" + index).innerHTML = hand.points;
    
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
                        game = new Game();
                        game.player.setActiveHand(hand);
                        handleCards(msg);
                        break;
                    case "card":
                        handleHit(msg);
                        break;
                    case "split":
                        handleSplit(msg);
                        break;
                    case "winner": //Likely to be useless
                        handleWinner(msg);
                    case "done":
                        handleGameDone(msg);
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

function handleGameDone(msg) {
    let hand_states = msg.wins;
    for (let i = 0; i < hand_states.length; i++) {
        let state = hand_states[i];

        handleWinner(i, state);
    }
    
    updateDealer(msg);
    game.updateScreen();
    game.togglePlayAgain();
}

function handleWinner(hand, state) {
    //clearCardHolders();
    if (state == "D")
        game.player.displayDrawHand(hand);
    else {
        if (state == "W")
        game.player.displayWinHand(hand);
        else
        game.player.displayLoseHand(hand);
    }
}

function isGameDone() {
    //Got through each hand, to determine if every hand has either lost, won or tied.
    for (let i = 0; i < handBets.length; i++) {
        let handContainer = document.getElementById("player__hand" + i.toString());
        let status = false; //Determines the end result

        if (handContainer.className.indexOf("win") > -1)
            status = true;
        if (handContainer.className.indexOf("lose") > -1)
            status = true;
        if (handContainer.className.indexOf("draw") > -1)
            status = true;

        if (status == false)
            return false;
    }

    return true;
}

function determineActiveHand() {
    if (handBets.length > 1) {
        hand++;

        if (game.player.hands[hand].hold)
            hand++;
    }

    if (hand == handBets.length-1)
        hand = 0;

    if (!game.player.hands[hand].hold)
        game.player.setActiveHand(hand);
    else
        game.player.setActiveHand(-1);
}

function doHit() {
    determineActiveHand();
    websocket.send(JSON.stringify({type: "game", content: "hit"}));
}
function doHold() {
    determineActiveHand();
    game.player.hands[hand].hold = true;
    websocket.send(JSON.stringify({type: "game", content: "hold"}));
}
function doDouble() {
    determineActiveHand();
    websocket.send(JSON.stringify({type: "game", content: "double"}));
}
function doSplit() {
    websocket.send(JSON.stringify({type: "game", content: "split"}));
    game.player.setActiveHand(hand);
}
function doInsure() {
    websocket.send(JSON.stringify({type: "game", content: "insure"}));
}

function doBet() {
    let input = document.getElementById("player__bet--input");
    let value = parseInt(input.value);

    let currency = parseInt(document.getElementById("player__info--capital").innerHTML);
    currency -= value;

    document.getElementById("player__info--capital").innerHTML = currency;

    websocket.send(JSON.stringify({type: "game", content: "bet", amount: value, secret: getCookie("secret")}));
    game.toggleBetInput();
}

function doRegister(){
    websocket.send(JSON.stringify({content:"register"}));
}

function doNewGame() {
    game.togglePlayAgainOnPress();
    game.player.resetResults();

    websocket.send(JSON.stringify({type: "game", content: "newgame"}));
}