const cardmod = require('./cards_foundation');

/*
    Blackjack Class
    Extends the cardgame class

    Handles blackjack related functionality
*/
class Blackjack extends cardmod.Cards{
    constructor() {
        super();
    }

    //Overwrite normal initGame from cardgame class
    //Additionally deals all players their first cards.
    initialize(decks, jokers) {
        this.fillDeck(decks, jokers);
        this.shuffleDeck();

        //Deal 2 cards to each player at the start of the game
        for (let i = 0; i < 2; i++)
            this.dealPlayers();

        //Deal the initial two dealer cards, one hidden and one hidden.
        let hidden_card = this.drawCard();
        hidden_card.visible = false;
        this.dealer.push(hidden_card);
        this.dealer.push(this.drawCard());
    }

   

    //Get the total card value of a card array.
    getCardsValue(cards) {
        let value = 0;
        for (let i = 0; i < cards.length; i++) {
            //Card: {suit: string, val: int/string, visible: bool}
            let card = cards[i];

            if (card == undefined)
                continue;

            if (!card.visible)
                continue;

            //If the card value contains a number from 0-9, add it to the current value.
            if (/[0-9]/.test(card.val)) {
                value += card.val;
                continue; //Skip everything else -> next card;
            }
                
            //If the card isn't an Ace, and not a number from above, add up with 10.
            if (card.val != "A") {
                value += 10;
                continue; //Skip everything else -> next card;
            }

            //Determine Ace value.
            if (card.val == "A") {
                if ((value + 11) <= 21) //If current value + 11 is less than 21, then add 11.
                    value += 11;
                else //Otherwise, add 1.
                    value += 1;
            }
        }
        return value;
    }

    //Goes through each hand for each player and determines whether it was a losing hand or not.
    determineWinner() {
        let dealer_value = this.getCardsValue(this.dealer);
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];

            for (let x = 0; x < player.hands.length; x++) {
                //Hand: {cards:[], bet: 0, isHolding: false, winner: null}
                let hand = player.hands[x],
                    value = this.getCardsValue(hand.cards);
                
                //Best hand
                if (dealer_value > value)
                    hand.winner = "L";
                if (value > dealer_value);
                    hand.winner = "W";

                //Draw
                if (dealer_value == 21 && value == 21) {
                    hand.winner = "D";
                    continue;
                }

                //Busts
                if (dealer_value > 21 && value > 21)
                    hand.winner = "L";
                if (dealer_value < 21 && value > 21)
                    hand.winner = "L";
                if (dealer_value > 21 && value < 21)
                    hand.winner = "W";
            }
        }
    }

    //Fill up the dealer cards until value is higher or equals to 17.
    fillDealer(value) {
        if (value >= 17) return;
        this.dealer.push(this.deck.shift());
        let new_value = this.getCardsValue(this.dealer);
        console.log(new_value + " .. " + value);
        this.fillDealer(new_value);        
    }

    //Hit -> Draw card
    hit(hand) {
        let drawn_card = this.deck.shift();
        hand.cards.push(drawn_card);
        return drawn_card;
    }

    //Hold -> End round
    hold(hand) {
        hand.isHolding = true;
        if (this.isEveryoneDone()) {
            let dealer_value = this.getCardsValue(this.dealer);
            console.log(dealer_value);
            this.dealer[0].visible = true;
            this.fillDealer(dealer_value);
            this.determineWinner();
        }
    }

    //Is all hands holding (Awaiting dealer reveal) ?
    isEveryoneDone() {
        //For all players
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            //And all player hands
            for(let x = 0; x < player.hands.length; x++) {
                let hand = player.hands[x];

                //If someone isn't done yet, return false.
                if (hand.isHolding == false)
                    return false;
            }
        }

        //We've been through them all, it checks out, everyone is done.
        return true;
    }

    /* 
        Draw a card, double the bet and hold.
        Can only be done at the start of the game,
        with the inital 2 cards.
    */
    double(hand) {
        let drawn_card = null;
        //If we're at the initial round and the hand isn't in a holding position.
        if (hand.cards.length == 2 && !hand.isHolding) {
            drawn_card = this.hit(hand);
            hand.bet *= 2;
            hand.isHolding = true;
        }
        return drawn_card;
    }

    /*
        Splitting a hand.
        Can only be done if the player has 2 of the same cards (No matter suit);
        Splits the hand, clones the first hand bet, and the player thus has 2 chances of winning
        or losing.

        Each hand is then dealt a card, so they have 2 each.
    */
   split(player, hand) {
       if (hand.cards.length == 2) {
            let cards = hand.cards;
            //If they are the same card values
            if (cards[0].val == cards[1].val) {
                //Create new hand with the same bet as the initial hand.
                let new_hand = new cardmod.Hand;
                //Push the first card into the new hand. -> Removes it from the other array as well.
                new_hand.cards.push(hand.cards.shift());

                //Deal new cards.
                this.hit(hand);
                this.hit(new_hand)

                //Push the new hand into the player hands array.
                player.hands.push(new_hand);
            }
       }
   }

   /*
        Insurance, is an initial bet that runs paralel with a game.
        Insurance can be done if the dealer starts with an Ace.
        The player bets that the dealer will get a blackjack (Ace + a picture card);
        The insurance bet is half the initial bet.
        Bet is paid 2:1
   */
   insurance(player) {
        let dealer_card = this.dealer[0];
        if (dealer_card.val = "A") {
            //Half the bet of the initial hand
            player.insurance = (player.hands[0].bet / 2);
        }
   }
}

module.exports = Blackjack;