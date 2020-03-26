class cardgame {
    constructor() {
        this.decks = [];
        this.players = [];
        this.jokers = true;
    }
    //Public functions
    startGame(decks = 1, bJokers = true) {
        this.jokers = bJokers;
        this.decks = cardgame.generateDeck(decks);
        this.shuffleDeck()
        return this;
    }

    drawCard() {
        if (this.decks == null) return null;
        return this.decks.shift();
    }

    shuffleDeck() { //Using Fisher-Yates Shuffle - https://bost.ocks.org/mike/shuffle/
        var m = this.decks.length, t, i;

        // While there remain elements to shuffle…
        while (m) {
    
        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);
    
        // And swap it with the current element.
        t = this.decks[m];
        this.decks[m] = this.decks[i];
        this.decks[i] = t;
        }
    
        return true;
    }

    addPlayer(player) {
        this.players.push(player);
    }

    //getCardValue(card) { } - Should be implemented for each card game iteration, since it changes based on game rules.

    isJokersInPlay() { return this.jokers; }

    /* 
     * Static ~ Private-ish functions, as made fairly obvious they're accessable through the class reference itself,
     * however inaccessable through a instanciation of the class.
     */
    static generateDeck(num) {
        let decks = [];
        if (num < 1) return null;
        for (let deck = 1; deck <= num; deck++) {
            for (let suit = 1; suit <= 4; suit++) {
                decks =  decks.concat(cardgame.generateSuit(suit));
            }
        }
        return decks;
    }

    static generateSuit(suit) {
        let result = [];
        let suitSize = this.jokers ? 15 : 13;
        for (let card = 1; card <= suitSize; card++) {
            if (card <= 10 && card > 1) { 
                result.push(cardgame.generateCard(suit,card));
                continue;
            }
            switch (card) {
                case 1:
                    result.push(cardgame.generateCard(suit,'A'));
                    break;
                case 11:
                    result.push(cardgame.generateCard(suit,'J'));
                    break;
                case 12:
                    result.push(cardgame.generateCard(suit,'Q'));
                    break;
                case 13:
                    result.push(cardgame.generateCard(suit,'K'));
                    break;
                case 14:
                case 15:
                    result.push(cardgame.generateCard(null,'Joker'));
                    break;
                default: break;
            }
        }
        return result;
    }

    static generateCard(type, value) {
        let cardType = null;
        switch(type) {
            case 1: cardType = "S"; break;
            case 2: cardType = "H"; break;
            case 3: cardType = "D"; break;
            case 4: cardType = "C"; break;
            default: cardType = null; break;
        }        
        return new card(cardType, value);
    }
}

class card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }
}

class player {
    constructor(hands, dealer = false) {
        this.activeGame = null;
        this.hands = this.generateHands(hands);
        this.isDealer = dealer;
        this.bet = 0;
    }

    //Public functions
    joinGame(game) {
        //game.addPlayer(this);
        this.activeGame = game;
    }
    
    getHandValue(hand) {
        let cards = this.hands[hand].getHold();
        return this.activeGame.getCardsValue(cards);
    }

    generateHands(num) {
        let freak = [];
        //Octopus man here we go
        for (let arm = 1; arm <= num; arm++) {
            freak.push(new hand());
        }
        return freak;
    }

    generateHand() {
        let newhand = new hand();
        this.hands.push(newhand);
        return newhand;
    }
}

class hand {
    #holding = [];
    constructor() { }

    grab(object) {
        return this.#holding.push(object);
    }

    drop(slot) {
        if (slot > 0) {
            return this.#holding.splice(slot,slot);
        }
        return this.#holding.splice(0,1);
    }

    getSize() { return this.#holding.length; }

    getHold(slot = -1) {
        if (slot < 0) return this.#holding; //Return it all!
        return this.#holding[slot];
    }
}

//Module - Used for require();
module.exports =  {
    cardgame,
    player
};

