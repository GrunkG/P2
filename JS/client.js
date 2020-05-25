const playerTarget = "player__card-container",
    playerSumTarget = "player__card-sum0",
    dealerTarget = "dealer__card-container",
    dealerSumTarget = "dealer__card-sum";

let game = null,
    secret = null;

let hand = 0,
    handBets = [],
    insurance = 0;

window.onload = () => {
    //Prepares the bet slider to be used
    let slider = document.getElementById("player__bet--input");
    let output = document.getElementById("player__bet--amount");
    output.innerHTML = slider.value;

    slider.oninput = function() {
        let output = document.getElementById("player__bet--amount");
        output.innerHTML = this.value;
    }

    //Prepares the login system to be used
    toggleLogin();
    handleLoginsystem();
    document.onkeydown = keyHandling;
};

/*########################################################
        BUTTON CORRECTION
            AND TIMER
##########################################################*/
function disableButtons(activeHand) {
    if (game.dealer.hands[0].cards.length == 0 || game.player.hands[0].cards.length == 0)
        return;

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

let countInterval;
function setCountdown(seconds){
    let countdownContainer = document.getElementById("countdown");
    let countdownNumber = document.getElementById("countdown__number");
    let countdownStroke = document.getElementById("countdown__stroke");
    let countdown = seconds;

    countdownContainer.style.display = "block";
    countdownStroke.style.animation = `countdown ${seconds}s linear infinite forwards`;
    countdownNumber.innerHTML = countdown;

    countInterval = setInterval(() => { //Counts down countdown by 1 every second
    countdown--;
    countdownNumber.innerHTML = countdown;
    }, 1000); //1 second

    setTimeout(() => { //Hides the container after the countdown
        countdownContainer.style.display = "none";
        clearInterval(countInterval);
    }, seconds * 1000);
}

function stopCountdown(){
    let countdownContainer = document.getElementById("countdown");
    clearInterval(countInterval);
    countdownContainer.style.display = "none";
}

function resetGamePlatform() {
    if (game != null) {
        game.player.resetResults();
        game.player.hands[0].cards = [];
        game.dealer.hands[0].cards = [];
        //game.updateScreen();
        game.removeAllRemotes();
        game.toggleBetInput();
    }

    document.getElementById(dealerSumTarget).innerHTML = "";
    document.getElementById(playerSumTarget).innerHTML = "";
    
}

function handleKicked() {
    //Display kicked warning
    alert("You've been kicked for being in-active, \nplease don't leave a game mid-play!");
    logout();
}

//Handles all server-client communication related to Blackjack
function gameHandler() {
    //                        ws = websocket
    websocket = new WebSocket(`ws://${host}:${port}/`);
    
    websocket.onopen = () => {
        let playerName = document.getElementById("username").value,
            playerCurrency = document.getElementById("player__info--capital").innerHTML;
        websocket.send(JSON.stringify({type: "game", content: "startgame", username: playerName, currency: playerCurrency, secret: secret}));
    }

    websocket.onmessage = (message) => {
            let msg = JSON.parse(message.data);
            console.log(msg);
            if (msg.type == "blackjack") {
                switch (msg.content) {
                    case "game created":
                        if (game != null)
                            game.removeAllRemotes();
                        game = new Game();
                        game.player.setActiveHand(hand);
                        handleCards(msg);
                        game.toggleBetInput();
                        break;
                    case "card":
                        handleCards(msg);
                        break;
                    case "split":
                        handleSplit(msg);
                        break;
                    case "insurance":
                        handleInsurance(msg);
                        break;
                    case "done":
                        stopCountdown();
                        handleGameDone(msg);
                        break;
                    case "update":
                        if (handBets.length > 0)
                            updateGame(msg);
                        break;
                    case "kicked":
                        handleKicked();
                        break;
                    case "countdown":
                        setCountdown(msg.seconds);
                        break;
                }

                if (game.player.hands[hand].cards != [])
                    disableButtons(game.player.hands[hand]);
            }        
    }
}

/*#########################################################################
        HANDLE CARDS 
            - Update User hand (On Hit)
            - Update dealer hand (On Hit)
            - 
###########################################################################*/

/*Handles input from server-side containing cards for the user and displays
  them in the correct hand as well as updates the bet if it changed or modified*/
function handleCards(msg, update = false) {
    //Player
    let player = msg.player,
        playerDeck = new Deck([]);
    
    handBets[player.hand] = player.bet;

    //For all cards on the active hand
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

//handleCards for the dealer -> Updates the dealer hand in case there is changes to it
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

function handleInsurance(msg) {
    let bet = parseInt(document.getElementById("player__info--bet").innerHTML);
    let player_insurance = msg.player.insurance;
    bet += player_insurance;
    insurance = player_insurance;
    document.getElementById("player__info--bet").innerHTML = bet;

}

function handleSplit(msg) {
    game.player.splitHand(msg.player.hand);
    handBets.push(handBets[hand]);
}

/*#######################################
        UPDATE FROM SERVER-SIDE
            - New player joins
            - Player left the game
            - Remote-player got new card
            - User did a hand split
#########################################*/

function updateGame(msg) {
    let players = msg.players,
        thisUsername = document.getElementById("username").value;
    
    if (game.remotes.length > 0)
        game.removeAllRemotes();

    //For each active player
    for (let i = 0; i < players.length; i++) {
        game.addRemote(players[i].username);
        let remote_deck = game.remotes[i],
            player = players[i],
            name = players[i].username;

        //For each active player hand
        for (let x = 0; x < player.hands.length; x++) {
            let hand = player.hands[x],
                remote_length;

            if (name == thisUsername) {
                updateHand(hand, x)
            }

            if (remote_deck.hands[x])
                remote_length = remote_deck.hands[x].cards.length;

            if (remote_length == hand.cards.length)
                continue;

            //
            for (let y = remote_length; y < hand.cards.length; y++) {
                let card = hand.cards[y];
                let new_card = new Card(card.val.toString(), card.suit);

                remote_deck.hands[x].cards.push(new_card);
            }
        }
        
    }
    
    game.updateScreen();
}

function updateHand(handObj, index) {
    let deck = new Deck([]),
        holding = handObj.isHolding;

    if (holding) {
        game.player.hands[hand].hold = true;
    }

    for (let i = 0; i < handObj.cards.length; i++) {
        let card = handObj.cards[i],
            new_card = new Card(card.val.toString(), card.suit);
            
            deck.cards.push(new_card);
    }
    game.player.hands[index] = deck;
    if (document.getElementById("player__card-sum" + index))
        document.getElementById("player__card-sum" + index).innerHTML = handObj.points;
    
}

/*##########################################################
        ENDED GAME FUNCTIONALITY
            - Update visuals
            - Display correct statistics
            - Reset and prepare for next game
            - Determine won/lost currency
############################################################*/
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

function resetGameValues() {
    document.getElementById("player__info--bet").innerHTML = 0;
    insurance = 0;
    handBets = [];
    hand = 0;
}

function handleWinner(hand, state) {
    let currency = parseInt(document.getElementById("player__info--capital").innerHTML),
        wins = parseInt(document.getElementById("player__info--wins").innerHTML),
        losses = parseInt(document.getElementById("player__info--losses").innerHTML),
        draws = parseInt(document.getElementById("player__info--draws").innerHTML),
        played = parseInt(document.getElementById("player__info--played").innerHTML),
        currency_won = parseInt(document.getElementById("player__info--currency_won").innerHTML),
        currency_lost = parseInt(document.getElementById("player__info--currency_lost").innerHTML);

    played++;
    if (state == "D") {
        game.player.displayDrawHand(hand);
        currency += handBets[hand];
        draws++;
    } else if (state == "W") {
        game.player.displayWinHand(hand);
        currency += handBets[hand] * 2;
        currency_won += handBets[hand];
        wins++;
    } else {
        game.player.displayLoseHand(hand);
        currency_lost += handBets[hand];
        losses++;
    }

    document.getElementById("player__info--capital").innerHTML = currency;
    document.getElementById("player__info--wins").innerHTML = wins;
    document.getElementById("player__info--losses").innerHTML = losses;
    document.getElementById("player__info--draws").innerHTML = draws;
    document.getElementById("player__info--played").innerHTML = played;
    document.getElementById("player__info--currency_won").innerHTML = currency_won;
    document.getElementById("player__info--currency_lost").innerHTML = currency_lost;
}

function handleInsuranceWin(insuranceState) {
    let currency = parseInt(document.getElementById("player__info--capital").innerHTML);
    if (insuranceState == "W") {
        currency += insurance * 2;
    }
    document.getElementById("player__info--capital").innerHTML = currency;
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

/*##########################################################
        BUTTON ACTIONS
############################################################*/
function doHit() {
    determineActiveHand();
    websocket.send(JSON.stringify({type: "game", content: "hit"}));
}
function doHold() {
    game.player.hands[hand].hold = true;
    determineActiveHand();
    //game.player.resetHandClassAttributes(hand);
    websocket.send(JSON.stringify({type: "game", content: "hold"}));
}
function doDouble() {
    let currency = parseInt(document.getElementById("player__info--capital").innerHTML);
    currency -= handBets[hand];
    document.getElementById("player__info--capital").innerHTML = currency;
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
    if ((currency - value) >= 0){    
        currency -= value;

        document.getElementById("player__info--capital").innerHTML = currency;

        websocket.send(JSON.stringify({type: "game", content: "bet", amount: value})); // , secret: getCookie("secret")
    } else alert("You have insufficient currency, try a smaller bet :)!");
}

function doRegister(){
    websocket.send(JSON.stringify({content:"register"}));
}

function doNewGame() {
    game.togglePlayAgainOnPress();
    /* game.player.resetResults();
    game.removeAllRemotes();
    game.dealer.hands[0].cards = [];
    game.updateScreen(); */
    resetGamePlatform();
    game.toggleBetInput();
    websocket.send(JSON.stringify({type: "game", content: "newgame"}));
}

function determineActiveHand() {
    if (handBets.length > 1) {
        hand = (game.player.hands[hand+1]) ? hand + 1 : 0;
        
        if (game.player.hands[hand].hold) {
            for (let i = 0; i < game.player.hands.length; i++) {
                if (!game.player.hands[hand].hold)
                    break;
                else
                    hand++;
            }
        }
        
    }

    if (hand >= game.player.hands.length)
        hand = 0;

    if (!game.player.hands[hand].hold)
        game.player.setActiveHand(hand);
    else
        game.player.resetHandClassAttributes(hand);

    disableButtons(game.player.hands[hand]);
}