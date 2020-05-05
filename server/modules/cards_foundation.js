//Variables
//            Spades, Hearts, Diamonds, Clubs
const suits = ["S", "H", "D", "C"];
//                                                      Jack, Queen, King, Ace
const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

/*
    Cards Class, handles general card game elements.
    Should for the most part function as an abstract class.
*/
class Cards { //Rename
    constructor() {
        this.players = [];  //Contains all player objects active in the current game.
        this.dealer = [];   //Contains all dealer cards
        this.deck = [];     //Contains all cards in the deck.
    }

    /*
        initialize(dekcs, jokers)
        Function handles initilization of a card game by:
            - Filling the 'deck' based on whether jokers should be used 
              and how many decks are in play.
            - Shuffles the deck after being filled.
    */
    initialize(decks) {
        this.fillDeck(decks, jokers);
        this.shuffleDeck();
    }

    fillDeck(decks, jokers) {
        //For each suit
        for (let suit = 0; suit < suits.length; suit++) {
            //And for each cards value
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

    shuffleDeck() { //Using Fisher-Yates Shuffle - https://bost.ocks.org/mike/shuffle/
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

    resetGame() {
        this.deck = [];
        this.dealer = [];
        resetPlayerHands();
    }

    resetPlayerHands() {
        for (let i = 0; i < this.players.length; i++) {
            let player  = this.players[i];
            player.resetHands();
        }
    }

    //Deals each player a card
    dealPlayers() {
        //Runs through each player currently in the player array
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i],
                hands = player.hands.length;

            //Run through each existing hand.
            for (let x = 0; x < hands; x++) {
                let hand = player.hands[x];

                //Deal first card in the deck.
                hand.cards.push(this.deck.shift());
            }
        }
    }

    //Draw a card from the top of the deck
    drawCard() {
        return this.deck.shift();
    }

    //Bet for hand - Not handling a currency check, since that may varie based on the
    //Service provider.
    bet(hand, amount) {
        hand.bet = amount;
    }

    //Remove player from the game in the case a player leaves or is forced a leave.
    removePlayer(playerToRemove) {
        for (let i = 0; i < this.players.length; i++) {
            let current = this.players[i];
            if (current == playerToRemove)
                this.players[i].pop();
        }
    }

}

class Player {
    constructor() {
        this.hands = [];
        this.hands.push(new Hand());
        this.game = null;
    }

    //Join a game, game = an instance of a class extending the Cards class
    join(game) {
        this.game = game;
        game.players.push(this);
    }

    resetHands() {
        this.hands = [];
        this.hands.push(new Hand());
    }
}

class Hand {
    constructor() {
        this.cards = [];
        this.bet = 0;
        this.isHolding = false;
        this.winner = null;
    }
}

module.exports = { Cards, Player, Hand };