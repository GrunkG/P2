//HTTP Server imports
const http = require('http');
const webtools = require('./modules/httptools');

//Websocket Server imports
const socket = require('websocket');
const mysql = require('mysql');
const dbConfig = require('./dbConfig.js');
const blackjackGame = require('./modules/blackjack').Blackjack;
const blackjackPlayer = require('./modules/blackjack').Blackjack_player;

//Encryption made 'easy'
const bcrypt = require("bcrypt-nodejs");

//MySQL Connection establishment, used
let sqlconnection = mysql.createConnection(dbConfig);
sqlconnection.connect((err) => {
    if (err) { throw err } else {
        console.log("Connected to database successfully.");
    };
});

//Hosting Config
const pathPublic = "./";
const defaultHTML = "html/blackjack.html";

const port = 3000,
    ip = "127.0.0.1",
    acceptedOrigin = `http://${ip}:${port}`;

//Multiplayer class extentions and game list
let activeGames = [];
class user extends blackjackPlayer {
    constructor() {
        super();
        this.games_played = 0;
        this.games_won = 0;
        this.games_lost = 0;
        this.games_drawn = 0;
        this.username = null;
        this.secret = null;
        this.connection = null;
    }
};

class multiplayer_blackjack extends blackjackGame {
    constructor() {
        super();
        this.finished = false;
        this.timer = null;
    }

    //Overvejende -> general?
    kickAFK() {
        let kickedPlayers = [];
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            for (let h = 0; h < player.hands.length; h++) {
                let hand = player.hands[h];
                if (!hand.isHolding) {
                    kickedPlayers.push(player);
                    this.removePlayer(player);
                }
            }
        }

        this.endGame();
        return kickedPlayers;
    }
}

/*#################################################################################


            Webserver
            Handles standard server to client HTTP requests


###################################################################################*/

const webserv = http.createServer((req, res) => {
    let method = req.method,
        url = req.url;
    
    //Handle GET requests
    if (method == "GET") {
        switch(url) {
            case "/":
                webtools.fileResponse(defaultHTML, pathPublic, res)
                break;
            default:
                webtools.fileResponse(req.url, pathPublic, res)
                break;
        }
    }

});

webserv.listen(port, ip, () => {
    let d = new Date();
    console.log(`[${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}] > Server listening at ${acceptedOrigin}`);
});


/*############################################################################


        Game server / Websocket server
        Handles game requests and standard TCP/IP connection requests


###############################################################################*/

//Game server / Websocket server starting, using the HTTP server as proxy.
const gameserv = new socket.server({httpServer: webserv});

//Boolean, does the connection come from an accepted origin?
function isAcceptedOrigin(origin) {
    return (origin == acceptedOrigin) ? true : false;
}

/*################################################################

    Game server / Websocket event handler
    Handles actual request from server to client
        - Determines what actions to take for the connection
          whether the user is loggin in or make a play in Blackjack.

##################################################################*/
gameserv.on('request', (req) => {
    //Only allow connections from our own website origin
    if (!isAcceptedOrigin(req.origin)) {
        console.log("Rejected connection from " + req.origin);
        req.reject();
        return;
    }

    //Accept connection and start handling events from the new connection
    //Everything runs asyncron for each new connection.
    let connection = req.accept(null, req.origin);
    console.log("Connection accepted from origin: " + req.origin);

    /*##################################################

        Variables used for the individual user connection

    ####################################################*/

    let playerObj = new user(),
        response = { type: "blackjack", content: "",
                    //Player response object
                    player: {hand: 0, cards: [], points: 0, winner: null, bet: 0, insurance: 0},
                    //Dealer response object
                    dealer: {cards: [], points: 0} },
        activeHand = 0; //Current playing hand -> 0 unless player has been able to split.
        playerObj.connection = connection;

    /*#################################################

        Events handling for incoming messages from client
        and handling of a disconnected user.
            'message':  Incoming client messages
            'close':    User disconnected
    
    ####################################################*/

    //Handle incoming messages from connection
    connection.on('message', (message) => {
        if (message.type != "utf8") return;
        
        //Try and convert message to an easy to handle JSON object.
        let msg = JSON.parse(message.utf8Data);
        if (msg.type == "game") gamehandler(msg);
        if (msg.type == "loginsystem") userhandler(msg);

    });

    //Handle closed connection
    //TODO: Remove player from remotes in an active game
    connection.on('close', (connection) => {
        //Remove player from its active game
        if (playerObj.game != null) {
            playerObj.game.leave(playerObj);
            cleanUpInactiveGames();
            console.log("Closed connection");
        }
    });

    /*#################################################
            Handling of login system using websockets
    ###################################################*/

    //Determine whether user is logging in/out or registering.
    function userhandler(message) {
        switch(message.content) {
            case "register":
                registerUser(message.user, message.pass);
                break;
            case "login":
                loginUser(message.user, message.pass);
                break;
            case "logout":
                logoutUser(message.user, message.secret);
            default:  break;
        }
    }

    function registerUser(username, password) {
        //Check for username
        sqlconnection.query(`SELECT username FROM account WHERE username='${username}'`, (error, result, fields) => {
            if (error) {
                throw error;
            } else if (result.length > 0) {
                    //Notify user, user already exists
                    send({type: "register", state: "exists"});
            } else {
                //Check password isn't empty.
                if (password.length > 0) {
                    //Register user
                    let passwordEncrypted = bcrypt.hashSync(password, null, null);
                    sqlconnection.query(`INSERT INTO account (username, password) VALUES ('${username}', '${passwordEncrypted}')`);
                    send({type: "register", state: "success"});
                } else if (password.length == 0) {
                    send({type: "register", state: "zeropassword"});
                }
                
                //Throw error, user had empty password
            }
        }); 
    }

    function logoutUser(username, secret) {
        //Remove user from game --
        //Remove "session"
        //-> Clientside show login --
        //Update game for remaininding players, if game wasn't empty --
        //Reset player connection
        console.log(`Logging out!:: S: ${secret}, U: ${username}`);
        //Find game in which the user is active
        for (let i = 0; i < activeGames.length; i++) {
            let game = activeGames[i];
            for (let p = 0; p < game.players.length; p++) {
                let player = game.players[p];
                if (player.username == username && player.secret == secret) { 
                    console.log("Found the player and game!");
                    //Correct user is found on this loop-through
                    //Maybe cards back in deck (bottom)
                    game.players.splice(p,1); //Remove player from index p
                    if (game.players.length > 0)
                        update(); //Update remotes for remainding players
                    else
                        cleanUpInactiveGames();

                    playerObj = new user(); //Reset player object, important info will be set upon next login
                    clearResponse();
                }
            }
        }
    }

    function loginUser(username, password) {
        sqlconnection.query(`SELECT currency, games_won, games_drawn, games_lost, games_played, ID, password, lastLogin, currency_won, currency_lost FROM account WHERE username='${username}'`, (error, result, fields) => {
            if (error) {
                throw error;
            } else if (password.length == 0) {
                    //Notify user, error password empty
                    send({type: "login", state: "zeropassword"});
            } else if (result.length > 0 && result[0].password.length > 15 && bcrypt.compareSync(password, result[0].password)) {
                //Login user
                
                //Generate random secret string to identify a session
                let effectiveCurrency = result[0].currency;
                let secret = generateSecret();
                let date = new Date(),
                    dateString =`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`,
                    previous = result[0].lastLogin,
                    bonus = false;
                if (previous != null) {
                    previous = new Date(previous);
                   if (isLaterDate(previous, date)) {
                        effectiveCurrency += 300;
                        bonus = true;
                   }     
                }
            

                sqlconnection.query(`UPDATE account SET secret = '${secret}', lastLogin = '${dateString}', currency = '${effectiveCurrency}' WHERE ID = '${result[0].ID}'`, (error, result, fields) => {
                    if (error)
                        throw error;
                });
                send({type: "login", state: "success", currency: effectiveCurrency, games_won: result[0].games_won, games_lost: result[0].games_lost,
                                                       games_played: result[0].games_played, games_drawn: result[0].games_drawn, identity: secret, username: username,
                                                       bonus: bonus, currency_won: result[0].currency_won, currency_lost: result[0].currency_lost});
            } else {
                //User doesn't exist or password is wrong
                send({type: "login", state: "noexist"});
            }
            //Throw error, user had empty password
        });
    }

    /* string generateSecret()
        Math.random():  Generates a value between 0 and 1
        toString(16):   Converts the value into a HEX value
        substring(2):   Removes the leading '0.' of the value
    */
    function generateSecret() {
        return Math.random().toString(16).substring(2);
    }

    /* bool isLaterDate(previous Date, new Date)
       Starts out by setting the newly generated date's
       time to 0, so it's possible to compare only date
       instead of date-time.
    */
    function isLaterDate(previous, newDate) {
        newDate.setHours(0,0,0,0);
        if (newDate > previous)
            return true;

        return false;
    } 

    

    function clearResponse() {
        response = { type: "blackjack", content: "",
        //Player response object
        player: {hand: 0, cards: [], points: 0, winner: null, bet: 0, insurance: 0},
        //Dealer response object
        dealer: {cards: [], points: 0} };
    }
    
    /*########################################################################


            Game handling
            startgame:  Received whenever a user establishes initial game connection
            newgame:    Received whenever a user wishes to 'play again'
            hit:        Received whenever a user wishes to 'hit' in Blackjack
            hold:       Received whenever a user wishes to 'hold' in Blackjack
            double:     Received whenever a user wishes to 'double' in Blackjack
            split:      Received whenever a user wishes to 'split' in Blackjack
            insure:     Received whenever a user wishes to 'insure' in Blackjack
            bet:        Received whenever a user wishes to 'bet' in Blackjack


    ##########################################################################*/

    function gamehandler(message) {
        //New game creation - Requires no game to be set.
        switch(message.content) {
            case "startgame":
                playerObj.username = message.username;
                playerObj.secret = message.secret;
                playerObj.currency = parseInt(message.currency);
                handleStartGame()
                break;
            case "newgame":
                handleNewGame();
                break;
        }

        //Game actions - Requires game to be set
        if (playerObj.game != null) {
            switch(message.content) {
                case "hit":
                    handleHit();
                    break;
                case "hold":
                    handleHold()
                    break;
                case "double":
                    handleDouble();
                    break;
                case "split":
                    handleSplit();
                    break;
                case "insure":
                    handleInsurance();
                    break;
                case "bet":
                    handleBet(message);
                    newGame();
                    break;
                default:  break;
            }
            //Updates everyone who's active in a given game.
            update();
        }

        
    }

    /* void handleStartGame()
        Determines whether the user attempting to make or join a game
        actually has any currency.
            If the the user does have more than 0 currency, then
            the user joins a game if one is already running with less than 8
            player. Otherwise it creates a new game and pushes the user into
            the new game.
    */
    function handleStartGame() {
        //Is the user poor?
        if (playerObj.currency > 0) {
            //Go through each already existing game stored in the activeGames array
            for (let i = 0; i < activeGames.length; i++) {
                //If for some reason the game is stored as null, skip to next loop-through.
                if (activeGames[i] == null || activeGames[i].finished)
                    continue;

                //Remove doubler / previous session / double login
                activeGames[i].removePlayer(playerObj);

                //If current game has less than 8 players, allow new user to join
                if (activeGames[i].players.length < 8) { // 8 is max players
                    //Game isn't full
                    if (!activeGames[i].isGameStarted()) {
                        playerObj.join(activeGames[i]);
                        initGame();
                    }
                }
            }

            //Wasn't able to join any existing games, create a new game for the user.
            if (playerObj.game == null) {
                activeGames.push(new multiplayer_blackjack()); //Starts new game
                playerObj.join(activeGames[activeGames.length-1]); //length -1 due to 0 index
                initGame();
            }
        }
    }

    /* void initGame()
        Initializes a game for the individual user based on whether the dealer
        has any cards or not.
            If the dealer has cards, then the user is joining an existing game
            and is then simply dealt 2 cards from the top of the deck.
            If the dealer doesn't have any cards, it's a new game and everyone
            is dealt 2 cards, player and dealer. One card not being visible on the
            dealer.
    */
    function initGame() {
        if (playerObj.game.dealer.length == 0)
            playerObj.game.initialize(4); //Initializes a game with 4 decks in play
        else
            handleNewJoin();

        //Resets the user hand to index 0, incase they just exit a game on a higher index.
        activeHand = 0;

        //Prepares the default response for a new game.
        clearResponse();
    }

    /* void handleNewJoin()
        Deals 2 cards to new player joining a game.
    */
    function handleNewJoin() {
        for (let i = 0; i < 2; i ++) {
            playerObj.game.hit(playerObj.hands[activeHand]);
        }
    }

    /* void handleNewGame()
        Resets the game board and player game,
        cleans up any existing empty games in the activeGames array
        and lastly allows the user to join a new existing game or create
        an entirely new game by calling handleStartGame().
    */
    function handleNewGame() {
        playerObj.game.resetGame();
        playerObj.game.resetPlayers();
        playerObj.game = null;
        cleanUpInactiveGames();

        handleStartGame();
    }

    /* void cleanUpInactiveGames()
        Loops through each game currently stored in the activeGames array
            If a game has 0 players, then there is no reason to have it
            and the games is promptly removed from the array.
    */
    function cleanUpInactiveGames() {
        for (let i = 0; i < activeGames.length; i++) {
            let players = activeGames[i].players.length;
            if (players == 0)
                activeGames.splice(i, 1);
        }
    }

    /* void newGame()
        Essentially what notes the client that a new game is now active.
        Used to send the initial information to the client-side user, so a
        new game can be displayed.
    */
    function newGame() {
        response.content = "game created";
        response.player.cards = playerObj.hands[activeHand].cards;
        response.dealer.cards = playerObj.game.dealer;
        updateResponsePoints();
        send(response);
    }

    /* void update()
        Loops through all players active in the game the currency connection
        is active in. Each player is then sent an update containing the correct
        hands for each player, which in themselves contain:
            - Cards
            - Bet amount
            - Are they in holding state?
            - Winning state
            - Card values

        This is then used client-side to correct display each remote player's cards
        at hand.
    */
    function update() {
            let updateResponse = {  type: "blackjack", content: "update" , players: []   };
            if (playerObj.game == null)
                return;

            //For each player active in the game
            for (let i = 0; i < playerObj.game.players.length; i++) {
                let playersResponse = {hands: [], insurance: 0, username: null},
                    player = playerObj.game.players[i],
                    bet = 0;

                playersResponse.username = player.username;
                //For each hand active for the player
                for (let x = 0; x < player.hands.length; x++) {
                    let hand = player.hands[x],
                        value = playerObj.game.getCardsValue(hand.cards);;
                    bet += hand.bet;
                    playersResponse.hands.push( {   cards: hand.cards, bet: hand.bet, 
                                                isHolding: hand.isHolding, winner: hand.winner, points: value }  );
                }

                //Don't push the player for update, unless they have bet.
                //If the player hasn't bet, then they're not in play.
                if (bet > 0) {
                    playersResponse.insurance = player.insurance;
                    updateResponse.players.push(playersResponse);
                }
            }

            //send(updateResponse);
            //Send to all
            for (let i = 0; i < playerObj.game.players.length; i++) {
                let player = playerObj.game.players[i];
                player.connection.send( JSON.stringify(updateResponse) );
            }
    }

    /* void updateResponsePoints
        Updates the default response object to contain the correct point values
        Used in several function relevant to hit, hold, split etc.
    */
    function updateResponsePoints() {
        response.player.points = playerObj.game.getCardsValue(playerObj.hands[activeHand].cards);
        response.dealer.points = playerObj.game.getCardsValue(playerObj.game.dealer);
        response.player.bet = playerObj.hands[activeHand].bet;
        response.player.hand = activeHand;
    }

    /*#######################################################
            Game currency related functionality
            - Updating currency in the MySQL database
            based on the individual user's hand.

    #########################################################*/

    /* void updateWinnings()
        Loops through each player active in the current user's active game.
        For each player the current currency amount is stored and is then updated
        based on how many hands has a winning, losing or drawn state as well as whether
        the user has an active insurance.

        Along with updating the currency amount, new statistics is updated based on again
        winning, losing etc.

        Eventually everything is updated in the database using MySQL queries.
     */
    function updateWinnings() {
        //Loop through each player in the currenct user's game
        for(let i = 0; i < playerObj.game.players.length; i++) {
            let player = playerObj.game.players[i],
                previous = player.currency,
                difference = 0;

            //Loop through each hand for the individual users
            for(let j = 0; j < player.hands.length; j++) {
                let hand = player.hands[j];
                currencyCalculator(hand, player, player.insurance);
                updatePlayerStats(player, hand);
            }
            //Difference will be positive on a net-gain and negative on a net-loss
            difference = player.currency - previous;

            //Update database with new values
            sqlconnection.query(`UPDATE account SET currency = ${player.currency},
                                                    games_won = games_won + ${player.games_won},
                                                    games_lost = games_lost + ${player.games_lost},
                                                    games_drawn = games_drawn + ${player.games_drawn},
                                                    games_played = games_played + ${player.games_played}
                                WHERE secret = '${player.secret}'`);

            //Update database currency_won and currency_lost based on the difference.
            if (difference > 0) {
                sqlconnection.query(`UPDATE account SET currency_won = currency_won + ${difference} WHERE secret = '${player.secret}'`);
            } else {
                let absoulute_currency = Math.abs(difference); //Negative -> non-negative
                sqlconnection.query(`UPDATE account SET currency_lost = currency_lost + ${absoulute_currency} WHERE secret = '${player.secret}'`);
            }

            //Prepares player statistics for next game play-through. 
            resetPlayerStatistics(player);
        }
    }

    /* void currencyCalculator(hand, player, insurance)
        Updates the player variable: currency
        currency is updated based on whether there was an active
        insurance and whether the hand had a winning, losing or drawn state.
     */
    function currencyCalculator(hand, player, insurance) {
        //Withdraws the correct amount of money in case the player insures
        if (insurance > 0 && dealerHasBlackjack()) {
            player.currency += insurance * 2;
        } else if (insurance > 0 && !dealerHasBlackjack()) {
            player.currency -= insurance;
        }
        
        //Adds or negates currency based on the hand bet
        if (hand.winner == "W") {
            player.currency += hand.bet;        
        } else if (hand.winner == "L") {
            player.currency -= hand.bet;
        }
    }

    /* bool dealerHasBlackjack()
        Determines whether the dealer has a blackjack based
        on the 2nd card (The one shown from the start) is
        an Ace and then checking whether the total card value is 21.
     */
    function dealerHasBlackjack() {
        let dealer = playerObj.game.dealer;
        let total = playerObj.game.getCardsValue(dealer);
        if (dealer[1].val == "A" && total == 21 && dealer.length == 2)
            return true;
        else
            return false;
    }

    /* void updatePlayerStats(player)
        Updates the individual player statistics based on the hand:
            - Games won
            - Games lost
            - Games drawn
            - Games played
    */
    function updatePlayerStats(player, hand) {
            player.games_played++;
            if (hand.winner == "W") {
                player.games_won++;           
            } else if (hand.winner == "L") {
                player.games_lost++;
            } else {
                player.games_drawn++;
            }
    }

    function resetPlayerStatistics(player) {
        player.games_won = 0;
        player.games_lost = 0;
        player.games_drawn = 0;
        player.games_played = 0;
    }

    /*###########################################################

            Server-side Blackjack card handling
            Here is all the functionality that sends information
            to client-side based on whether the client chooses
            to hit, hold, split etc.

     ############################################################*/

    /* void handleHit()
        Gives the player a card from the deck,
        prepared the response to client-side and
        determines whether the hand is a bust or blackjack.
        In such a case the hand is automatically put in a holding state.
        Lastly the activeHand variable is updated through the setNextHand()
        function.
     */
    function handleHit() {
        //Deal the player a card from the top of the deck.
        playerObj.game.hit(playerObj.hands[activeHand]);

        //Prepare the response object
        response.content = "card"; //We're dealing with cards here

        //Update the response with current player cards
        response.player.cards = playerObj.hands[activeHand].cards;

        //Update the response points so correct card values are sent along.
        updateResponsePoints();
        send(response); //Send the response to client-side

        //In case of a bust or blackjack
        if (response.player.points >= 21) {
            handleHold();
        }

        //Determine whether the activeHand variable should be increased or not.
        setNextHand();
    }

    //Determine what to do with the activeHand variable
    function setNextHand() {
        /*If the players has more than 1 hand, and we're not already dealing with
          the last hand, then increase activeHand value by 1*/
        if (playerObj.hands.length > 1)
            activeHand++;
        if (activeHand == playerObj.hands.length) //We're at the end reset to index 0
            activeHand = 0;
    }

    /* void handleHold()
        Sets the current active hand to a holding position, and determine whether
        the active hand needs to increase to next index.
            If everyone has their hands in a holding state, then reveal the dealer cards
            and determine winner hands through the announceWinner() function.
            Otherwise set a timer that will kick everyone who isn't done after 1 minute,
            and then determine winner hands.
    */
    function handleHold() {
        //Set player hand to a holding state and determine next active hand.
        playerObj.game.hold(playerObj.hands[activeHand]);
        setNextHand();

        //If everyone are done and in a holding position, announce winners.
        if (playerObj.game.isEveryoneDone()) {
            announceWinner();
            playerObj.game.finished = true;
        } else { //Otherwise, sudden death
            if (playerObj.game.timer == null) {
                playerObj.game.players.forEach(player => { //Sends each player a message to start a countdown
                    let countdownMsg = {type: "blackjack", content: "countdown", seconds: 60};
                    player.connection.send(JSON.stringify(countdownMsg));
                });
            
                playerObj.game.timer = setTimeout(()=> {
                    if (playerObj.game != null) {
                        if (!playerObj.game.finished) {
                            let kickedPlayers = playerObj.game.kickAFK();
                            if (kickedPlayers.length > 0) {
                                announceKicked(kickedPlayers)
                            }
                            announceWinner();
                            playerObj.game.finished = true;
                        }
                    }
                }, 60000); //60 seconds
            }
        }
    }

    /* void announceKicked(players)
        Loops through each player whom has been determine to be AFK (Away from keyboard)
        and announces to them client-side that it's time to logout forcefully.
    */
    function announceKicked(players) {
        for(let i = 0; i < players.length; i++) {
            let player = players[i];
            let kickedResponse = {type: "blackjack", content: "kicked"}

            player.connection.send(JSON.stringify(kickedResponse));
        }
    }

    /* void announceWinner()
        Sends out a response to each client-side player, whether they won, lost or had a draw.

        If the game is already finished for some reason, exit the function,
        otherwise if everyone are done, loop through each player and determine their winning states.
        Lastly update each player's winnings and stats through the updateWinnings() function.
     */
    function announceWinner() {
        //If the game has already finished for some reason, exit function.
        if (playerObj.game.finished)
            return;
            
        clearTimeout(playerObj.game.timer);
        //If everyone has holding state hands, then prepare a response for each player with their winning states.
        if (playerObj.game.isEveryoneDone()) {

            //Send announcement to everyone, not just the last player to trigger a hold
            for (let i = 0; i < playerObj.game.players.length; i++) {
                let player = playerObj.game.players[i];
            
                let response = {type: "blackjack", content: "done", wins: [], insurance: "L", dealer: {cards: [], points: 0} };

                //Push each winning state for each hand of the player into the wins array.
                for (let i = 0; i < player.hands.length; i++) {
                    response.wins.push(player.hands[i].winner);
                }

                //Prepare response with end result dealer cards and cards value.
                response.dealer.cards = playerObj.game.dealer;
                response.dealer.points = playerObj.game.getCardsValue(playerObj.game.dealer);

                //If the dealer has a blackjack, then update the response insurance variable accordingly
                if (dealerHasBlackjack())
                    response.insurance = "W";
                
                player.connection.send( JSON.stringify(response) );
            }

            //Update player currency and statistics based on hand winnings.
            updateWinnings();
        }
    }

    /* void handleDouble()
        Gives a last card to the current active player hand
        and puts it into hold, along with doubling the player bet.
    */
    function handleDouble() {
        let hand = playerObj.hands[activeHand];
        //Can only be done at the start where the player has 2 cards at hand.
        if (hand.cards.length == 2) {
            //Get a card and double the bet
            playerObj.game.double(hand);

            //Prepare the response object
            response.content = "card";
            response.player.cards = playerObj.hands[activeHand].cards;
            updateResponsePoints();
            send(response);

            //Put the hand into a holding state
            handleHold();
        }
    }

    /* void handleSplit()
        Call the blackjack split function (Split the hand and get a card for each hand)
        Prepare a response telling the client-side to split their hand. (Visually)
    */
    function handleSplit() {
        let hand = playerObj.hands[activeHand];
        //If the game successfully split the player hand
        if ( playerObj.game.split(playerObj, hand) == true) {

            //Hand has been split, tell the server to do it visually.
            response.content = "split";
            updateResponsePoints();
            send(response);
        }
    }

    /* void handleInsurance()
        Determine whether the player can insure,
        if successfull send a response to client-side containing correct insurance amount.
    */
    function handleInsurance() {
        //If insurance is possible
        if(playerObj.game.insurance(playerObj) == true) {

            //Prepare response -> Set response insurance to active insurance.
            response.player.insurance = playerObj.insurance;
            response.content = "insurance";
            send(response);
        }
    }

    /* void handleBet(msg) msg: message
        Sets the hand bet based on how much the client has bet client-side, if
        the player has the needed curreny and sends a response with new values to
        be updated visually.
     */
    function handleBet(msg) { //Send cards here
        let bet = msg.amount;

        //If the player actually has the currency needed
        if (bet <= playerObj.currency) {
            //Sent the hand bet to the bet amount
            playerObj.game.bet(playerObj.hands[activeHand], bet);
            
            //Prepare the response object
            response.content = "card";
            response.player.cards = playerObj.hands[activeHand].cards;
            updateResponsePoints();
            send(response);
        }
    }

    //Simplified send function that stringifies a JSON object.
    function send(message) {
        connection.send( JSON.stringify(message) );
    }
});