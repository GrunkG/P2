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
        if (dealerPoints == 21 && handValue == 21) return 2; //Draw
        if (handValue == 21) return true; //Win
        if (dealerPoints == 21) return false; //Lose
        if (dealerPoints > 21 && handValue > 21) return false //Double bust, dealer wins

        //If none of the above, highest hand value wins.
        return (dealerPoints < handValue) ? true : false; 
    }
}


module.exports = blackjack;