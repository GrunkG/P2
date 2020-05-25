//Variables
//            Spades, Hearts, Diamonds, Clubs
const suits = ["S", "H", "D", "C"];
//                                                          Jack, Queen, King, Ace
const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

/*  Cardgame Class, handles general card game elements.
    Should for the most part function as an abstract class.

    The general card game frame to be expanded upon based on different card games,
    and their individual rules and actions.
*/
class Cardgame { //Rename
    constructor() {
        this.players = [];  //Contains all player objects active in the current game.
        this.dealer = [];   //Contains all dealer cards
        this.deck = [];     //Contains all cards in the deck.
    }

    /*
        initialize(decKs, jokers)
        Function handles initilization of a card game by:
            - Filling the 'deck' based on whether jokers should be used 
              and how many decks are in play.
            - Shuffles the deck after being filled.
    */
    initialize(decks) {
        this.fillDeck(decks, jokers);
        this.shuffleDeck();
    }

    /*Fills the game Deck based on how many decks are used as input
      and whether jokers are in play.*/
    fillDeck(decks, jokers) {
        //For each deck to be in play
        for (let deck = 0; deck < decks; deck++) {
            //For each suit in a deck
            for (let suit = 0; suit < suits.length; suit++) {
                //Add a card for each card value
                for (let i = 0; i < values.length; i++) {
                    let value = 0,                  //Initiate value variable
                        current_suit = suits[suit]; //Current suit for easier read.

                    //If the card index is below 8.
                    if (i >= 0 && i <= 8)
                        value = parseInt(values[i]); //Convert string to integer.
                    if (i > 8)
                        value = values[i];          //Use the string value, since it might differ based on the game.

                    //Construct card object
                    let card = {suit: current_suit, val: value, visible: true};
                    //Push new card into the deck array.
                    this.deck.push(card); 
                }
            }
        }

        //If jokers are in play, add 2 jokers for each deck.
        if (jokers) {
            //For all decks the decks in play
            for (let i = 0; i < decks; i++) {
                //Do twice
                for (let x = 0; x < 2; x++) {
                    let joker = {suit: null, val: "Joker", visible: true}
                    this.deck.push(joker);
                }
            }
        }
    }

    /* Using Fisher-Yates Shuffle - https://bost.ocks.org/mike/shuffle/
       Shuffles a deck by:
        - Getting a random element in the deck and the 'i' variable to selected element
                - Done by getting a random element between 0 and 1 (0.xxxx) and then multiplying
                  the random value by 'm'. 'm' is initially the deck length.
        - 't' is set to the 'm' index. 'm' is decreased after the random element, setting it to the last
          index in the array initially.
        - index 'm' is then set to be the random element 'i' and 'i' is set to have the element that used
          to be the last element in the iteration.

      This way a random element is selected and swapped with the last element within a decreasing range in the array,
      as such the elements that has already been swapped cannot be selected again. Eventually the while-loop will have
      come to the first element of the array and be done.
     */
    shuffleDeck() {
        var m = this.deck.length, t, i;

        // While there remain elements to shuffle…
        while (m) {
            // Pick a remaining element…
            i = Math.floor(Math.random() * m--); //Math.random outputs a number from 0 to less than 1
        
            // And swap it with the current element.
            t = this.deck[m];
            this.deck[m] = this.deck[i];
            this.deck[i] = t;
        }
    }

    /*Deals each player a card by looping through the players and hand arrays, 
      then inserting a card from the deck.*/
    dealPlayers() {
        //Runs through each player currently in the player array
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i],   //Current selected player
                hands = player.hands.length;//Amount of hands the player has

            //Run through each existing hand of the player.
            for (let x = 0; x < hands; x++) {
                let hand = player.hands[x]; //Current hand

                //Draws card from deck and inserts into hand
                hand.cards.push(this.drawCard());
            }
        }
    }

    /*Deal first card in the deck. 
        shift() takes the first element in an array (top of the deck)
        much like pop() takes the last element in an array (bottom of the deck)
    */
    drawCard() {
        return this.deck.shift();
    }

    /*##################################
            BOOL FUNCTIONS
    ####################################*/

    // bool - checks whether everyone in players array has bet with each hand.
    hasEveryoneBet() {
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            let hand = player.hands[0];
            
            if (hand.bet == 0)
                return false;
        }
        return true;
    }

    // bool - checks whether a certain player object is in this specific game.
    isPlayerInGame(playerToCheck) {
        for(let i = 0; i < this.players.length; i++) {
            if (playerToCheck == this.players[i])
                return true;
        }
        return false;
    }

    /*#################################################
            PLAYER MANAGEMENT & GAME RESETING
    ###################################################*/

    //Remove player from the game in the case a player leaves or is forced a leave.
    removePlayer(playerToRemove) {
        for (let i = 0; i < this.players.length; i++) {
            let current = this.players[i];
            if (current == playerToRemove) {
                //playerToRemove.resetHands();
                playerToRemove.game = null;
                this.players.splice(i, 1);
            }
        }
    }

    //Removes a play
    leave(playerObject) {
        if (this.players.length > 1) {
            this.removePlayer(playerObject);
        } else {
            this.players = [];
        }
    }

    /* Reset the deck, dealer arrays to empty arrays and
       resets the player hands */
    resetGame() {
        this.deck = [];
        this.dealer = [];
        this.resetPlayerHands();
    }

    //Reset the players array to empty array.
    resetPlayers() {
        this.players = [];
    }

    //Reset all players hands in the players array
    resetPlayerHands() {
        for (let i = 0; i < this.players.length; i++) {
            let player  = this.players[i];
            player.resetHands();
        }
    }
}

class Player {
    constructor() {
        this.hands = [new Hand()];
        this.game = null;
    }

    //Join a game, game = an instance of a class extending the Cards class
    join(game) {
        this.game = game;
        game.players.push(this);
    }

    //Reset player hands to initial value.
    resetHands() {
        this.hands = null;
        this.hands = [new Hand()];
    }

    //Reset an individual hand on index.
    resetHand(index) {
        this.hand[index] = new Hand();
    }
}

class Hand {
    constructor() {
        this.cards = [];
        this.winner = null;

        this.bet = 0;
        this.isHolding = false;
    }
}

module.exports = { Cardgame, Player, Hand };