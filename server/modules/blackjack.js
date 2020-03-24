let cardmod = require('./cards_foundation');

class blackjack extends cardmod.cardgame {
    constructor() {
        super();
        this.gameID = null; //Used for online identification
    }

    hit() {
        return this.drawCard();
    }

    hold(player) { player.active = false; }
    
    double(player) {
        //WIP
    }

    split(player) {
        //WIP
    }

    insurance(player) {
        //WIP
    }

    getCardValue(card, points) {
        if (/[0-9]/.test(card.value)) return card.value;
        if (card.value == "A") return ( (points + 11) <= 21) ? 11 : 1;
        switch (card.value) {
            case "J": 
            case "Q": 
            case "K":
                return 10;
                break;
            default:
                return 0;
                break;
        }
    }
    
    getCardsValue(cards) {
        let value = 0;
        for (i = 0; i < cards.length; i++) {
            value += this.getCardValue(cards[i], value)
        }
        return value;
    }
}


module.exports = blackjack;