let cardmod = require('./cards_foundation');

class blackjack extends cardmod.cardgame {
    constructor() {
        super();
        this.gameID = null; //Used for online identification
        this.dealer = []; //temp?
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
        return 0;
    }
    
    getCardsValue(cards) {
        let value = 0;
        for (let i = 0; i < cards.length; i++) {
            value += this.getCardValue(cards[i], value)
        }
        return value;
    }

    determineWin(handValue) {
        let dealerPoints = this.getCardsValue(this.dealer);
        if (handValue == 21 && (dealerPoints < 21 || dealerPoints > 21) ) return true;
        if (dealerPoints == 21 && (handValue < 21 || handValue > 21) ) return false;
        return (handValue > dealerPoints) ? true : false;
    }
}


module.exports = blackjack;