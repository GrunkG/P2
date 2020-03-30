//Variables
//            Spades, Hearts, Diamonds, Clubs
const suits = ["S", "H", "D", "C"];
//                                                      Jack, Queen, King, Ace
const values = ["2", "3", "4", "5", "6", "7", "8", "9", "J", "Q", "K", "A"];

/*
    Cardgame Class, handles general card game elements.
    Should for the most part function as an abstract class.
*/
class Cards {
    constructor() {
        this.players = [];
        this.dealer = [];
        this.deck = [];
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

    fillDeck(decks) {
        //For each suit
        for (let suit = 0; suit < suits.length; suit++) {
            //And for each cards value
            for (let i = 0; i < values.length; i++) {
                let value = 0,                  //Initiate value variable
                    current_suit = suits[suit]; //Current suit for easier read.

                //If the card index is below 7 -> below picture cards and Ace.
                if (i >= 0 && i <= 7)
                    value = parseInt(values[i]); //Convert string to integer.
                if (i > 7)
                    value = values[i];          //Use the string value, since it might differ based on the game.

                //Construct card object
                let card = {suit: current_suit, val: value};
                //Push new card into the deck array.
                this.deck.push(card); 
            }
        }
    }

    shuffleDeck() { //Using Fisher-Yates Shuffle - https://bost.ocks.org/mike/shuffle/
        var m = this.deck.length, t, i;

        // While there remain elements to shuffle…
        while (m) {
            // Pick a remaining element…
            i = Math.floor(Math.random() * m--);
        
            // And swap it with the current element.
            t = this.deck[m];
            this.deck[m] = this.deck[i];
            this.deck[i] = t;
        }
    }

    //Deals each player a card
    dealPlayers() {
        //Runs through each player currently in the player array -> from the cardgame class
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

    drawCard() {
        return this.deck.shift();
    }

}

class Player {
    constructor() {
        this.hands = [];
        this.hands.push(new Hand());
        this.game = null;
    }

    join(game) {
        this.game = game;
        game.players.push(this);
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