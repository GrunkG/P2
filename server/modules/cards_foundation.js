class card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }
}

class cardgame {
    constructor(decks, bJokers) {
        this.jokers = bJokers; //Bool, true or false
        this.decks = this.generateDeck(decks);
     }
     
    generateSuit(suit) {
        let result = [];
        let suitSize = this.jokers ? 15 : 13;
        for (let card = 1; card <= suitSize; card++) {
            if (card <= 10 && card > 1) { 
                result.push(this.generateCard(suit,card));
                continue;
            }
            switch (card) {
                case 1:
                    result.push(this.generateCard(suit,'Ace'));
                    break;
                case 11:
                    result.push(this.generateCard(suit,'Jack'));
                    break;
                case 12:
                    result.push(this.generateCard(suit,'Queen'));
                    break;
                case 13:
                    result.push(this.generateCard(suit,'King'));
                    break;
                case 14:
                case 15:
                    result.push(this.generateCard(null,'Joker'));
                    break;
                default: break;
            }
        }
        return result;
    }

    generateCard(type, value) {
        let cardType = null;
        switch(type) {
            case 1: cardType = "Spades"; break;
            case 2: cardType = "Hearts"; break;
            case 3: cardType = "Diamonds"; break;
            case 4: cardType = "Clubs"; break;
            default: cardType = null; break;
        }        
        return new card(cardType, value);
    }

    generateDeck(num) { //Re-write as recursive function?
        let decks = [];
        if (num < 1) return null;
        for (let deck = 1; deck <= num; deck++) {
            for (let suit = 1; suit <= 4; suit++) {
                decks =  decks.concat(this.generateSuit(suit));
            }
        }
        return decks;
    }

    drawCard() {
        if (this.decks == null) return null;
        return this.decks.shift();
    }

    putInDeck(card) {
        if (card instanceof card) {
            this.decks.push(card);
            return true;
        }
        return false;
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
}

class hand {
    #holding = [];
    constructor(size) {
        this.handSize = size;
    }

    grab(object) {
        if (this.#holding.length == this.handSize) return false;
        return this.#holding.push(object);
    }

    drop(slot) {
        if (slot < 0) return null; //Arrays don't go lower than 0
        if (slot > this.handSize) return this.#holding; //Return full hand array
        if (slot > 0) {
            return this.#holding.splice(slot,slot);
        }
        return this.#holding.splice(0,1);
    }

    getSize() { return this.handSize; }

    getHold(slot) {
        if (slot < 0) return null; //Arrays don't go lower than 0
        if (slot > this.handSize) return this.#holding; //Return full hand array
        return this.#holding[slot];
    }
}

class player extends cardgame {
    constructor(hands, handSize) {
        super();
        this.hands = this.generateHands(hands, handSize);
        this.game = null;
        this.ID = null;
    }

    generateHands(num, size) {
        let freak = [];

        //Octopus man here we go
        for (let arm = 1; arm <= num; arm++) {
            freak.push(new hand(size));
        }
        return freak;
    }

    //Spil håndtering
    join_game(game) { }
    get getGameID() {}
}

//Module - Used for require();
module.exports =  {
    cardgame,
    player
};

