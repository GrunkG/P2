const playerTarget = "player__card-container",
    playerSumTarget = "player__card-sum0",
    dealerTarget = "dealer__card-container",
    dealerSumTarget = "dealer__card-sum";

let game = null;

let hand = 0,
    handBets = [],
    insurance = 0;

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
    handBets.push(handBets[hand]);
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
    
    game.removeAllRemotes();
    game.addRemotes(players.length);

    //For each active player
    for (let i = 0; i < players.length; i++) {
        let remote_deck = game.remotes[i],
            player = players[i];

        //For each active player hand
        for (let x = 0; x < player.hands.length; x++) {
            let hand = player.hands[x],
                remote_length = remote_deck.hands[x].cards.length;

            if (remote_length == hand.cards.length)
                continue;

            //-> Add hand cards to a hand element for each separat hand
            for (let y = remote_length; y < hand.cards.length; y++) {
                let card = hand.cards[y];
                let new_card = new Card(card.val.toString(), card.suit);
                
                //updateHand(hand, x);

                remote_deck.hands[x].cards.push(new_card);
            }
        }
        
        //Update the shown cards
        //game.updateScreen();
    }
    game.updateScreen();
}

function resetRemotes() {
    let remotes = document.getElementsByClassName("remote-player");
    for (let i = 0; i < remotes.length; i++) {
        remotes[i].remove();
    }

    game.remotes = [];
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
    websocket = new WebSocket(`ws://${host}:${port}/`);
    
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
                        game.toggleBetInput();
                        break;
                    case "card":
                        handleHit(msg);
                        break;
                    case "split":
                        handleSplit(msg);
                        break;
                    case "insurance":
                        handleInsurance(msg);
                        break;
                    case "done":
                        handleGameDone(msg);
                        break;
                    case "update":
                        updateGame(msg);
                        break;
                }
                disableButtons(game.player.hands[hand]);
            }
        } catch (err) {
            console.log(err);
        }
        
    }
}

function handleInsurance(msg) {
    let bet = parseInt(document.getElementById("player__info--bet").innerHTML);
    let player_insurance = msg.player.insurance;
    bet += player_insurance;
    insurance = player_insurance;
    document.getElementById("player__info--bet").innerHTML = bet;

}

function handleGameDone(msg) {
    let hand_states = msg.wins;
    for (let i = 0; i < hand_states.length; i++) {
        let state = hand_states[i];

        handleWinner(i, state);
    }
    
    handleInsuranceWin(msg.insurance);
    resetGameValues();

    updateDealer(msg);
    game.updateScreen();
    game.togglePlayAgain();
}

function handleWinner(hand, state) {
    let currency = parseInt(document.getElementById("player__info--capital").innerHTML);
    //clearCardHolders();
    if (state == "D") {
        game.player.displayDrawHand(hand);
        currency += handBets[hand];
    } else if (state == "W") {
        game.player.displayWinHand(hand);
        currency += handBets[hand] * 2;
    } else {
        game.player.displayLoseHand(hand);
    }

    document.getElementById("player__info--capital").innerHTML = currency;
}

function handleInsuranceWin(insuranceState) {
    let currency = parseInt(document.getElementById("player__info--capital").innerHTML);
    if (insuranceState == "W") {
        currency += insurance * 2;
    }
    document.getElementById("player__info--capital").innerHTML = currency;
}

function resetGameValues() {
    document.getElementById("player__info--bet").innerHTML = 0;
    insurance = 0;
    handBets = [];
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
        console.log("Step 1 -- " + hand);

        if ( (hand+1) < handBets.length) {
            console.log("Step 2 -- " + hand);
            if (game.player.hands[hand].hold)
                hand++;
            else
                hand--;

            console.log("Step 3 -- " + hand);
        }
    }

    if (hand == handBets.length)
        hand = 0;

    if (!game.player.hands[hand].hold)
        game.player.setActiveHand(hand);
    else
        game.player.setActiveHand(-1);

    disableButtons(game.player.hands[hand]);
}

function doHit() {
    determineActiveHand();
    websocket.send(JSON.stringify({type: "game", content: "hit"}));
}
function doHold() {
    determineActiveHand();
    game.player.hands[hand].hold = true;
    game.player.resetHandClassAttributes(hand);
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
}

function doRegister(){
    websocket.send(JSON.stringify({content:"register"}));
}

function doNewGame() {
    game.togglePlayAgainOnPress();
    game.player.resetResults();
    game.removeAllRemotes();
    websocket.send(JSON.stringify({type: "game", content: "newgame"}));
}

function disableButtons(activeHand) {
    enableButtonIf(activeHand.cards.length == 2, "double");
    enableButtonIf(activeHand.cards.length == 2 && activeHand.cards[0].value == activeHand.cards[1].value, "split");
    enableButtonIf(game.dealer.hands[0].cards[0].value == "A" && insurance == 0 && handBets.length == 1, "insurance");
}

function enableButtonIf(enable, button) {
    if (enable) { //Enable button
        document.getElementById("button-" + button).setAttribute("class", "button-" + button);
    } else { //Disable button
        document.getElementById("button-" + button).setAttribute("class", "button-" + button + " inactive");
    }
}