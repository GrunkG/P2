const cardmod = require('./cards_foundation');

/*
    Blackjack Class
    Extends the Cards class

    Handles blackjack related functionality
*/
class Blackjack extends cardmod.Cards{
    constructor() {
        super();
    }

    //Overwrite normal initialize from Cards class
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
        //For all players
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            //And all player hands
            for (let x = 0; x < player.hands.length; x++) {
                //Hand: {cards:[], bet: 0, isHolding: false, winner: null}
                let hand = player.hands[x],
                    value = this.getCardsValue(hand.cards);
                
                
                //W = win, L = Loss, D = Draw
                //Best hand
                if (dealer_value > value)
                    hand.winner = "L";
                if (value > dealer_value)
                    hand.winner = "W";
                if (dealer_value == 21 && value != 21)
                    hand.winner = "L";
                if (value == 21 && dealer_value != 21)
                    hand.winner = "W";

                //Draw
                if (dealer_value == 21 && value == 21) {
                    hand.winner = "D";
                    continue;
                }
                if (dealer_value == value)
                    hand.winner = "D";

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
        //If the current dealer hand value is above or equal to 17
        //Stop, we've aquired as many cards as needed.
        if (value >= 17) return;
        //If not, draw a new card from the top of the stack
        this.dealer.push(this.deck.shift());
        //Calculate new dealer hand value
        let new_value = this.getCardsValue(this.dealer);
        //Do it all over again, but this time based on the current dealer value.
        this.fillDealer(new_value);        
    }

    //Hit -> Draw card
    hit(hand) {
        //Can only draw a card if not in a holding position
        if (!hand.isHolding) {
            //Draw a card from the top of the stack.
            let drawn_card = this.deck.shift();
            //Push the new card into the hand cards array.
            hand.cards.push(drawn_card);
            //Return the card which was drawn, for easier client response handling.
            return drawn_card;
        }
    }

    //Hold -> End round
    hold(hand) {
        //Set current hand to be in a holding position/state.
        hand.isHolding = true;

        //Check if everyone is currently holding
        if (this.isEveryoneDone()) {
            //Show the hidden card.
            this.dealer[0].visible = true;
            //Everyone is holding, get dealer value
            let dealer_value = this.getCardsValue(this.dealer);
            //Fill dealer with additional cards.
            this.fillDealer(dealer_value);
            //Determine what hands won or lost.
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
                //Hand: {cards:[], bet: 0, isHolding: false, winner: null}
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
            drawn_card = this.hit(hand); //Draw a card
            hand.bet *= 2; //Double hand bet
            hand.isHolding = true; //Is now holding and awaiting dealer reveal.
        }

        return drawn_card; //Return drawn card, makes it easier to handle a response to client.
    }

    /*
        Splitting a hand.
        Can only be done if the player has 2 of the same cards (No matter suit);
        Splits the hand, clones the first hand bet, and the player thus has 2 chances of winning
        or losing.

        Each hand is then dealt a card, so they have 2 each.
    */
   split(player, hand) {
       //If the player hand has only 2 cards and isn't in a holding position.
       if (hand.cards.length == 2 && !hand.isHolding) {
            let cards = hand.cards;
            //If both cards have the same card values
            if (cards[0].val == cards[1].val) {
                //Create new hand with the same bet as the initial hand.
                let new_hand = new cardmod.Hand;
                new_hand.bet = hand.bet;

                //Push the first card into the new hand. -> Removes it from the other array as well.
                new_hand.cards.push(hand.cards.pop());

                //Deal new cards.
                this.hit(hand);
                this.hit(new_hand)

                //Push the new hand into the player hands array.
                player.hands.push(new_hand);

                return true; //Success
            }
       }

       return false; //Something went wrong, or client is attempting to cheat.
   }

   /*
        Insurance, is an initial bet that runs paralel with a game.
        Insurance can be done if the dealer starts with an Ace.
        The player bets that the dealer will get a blackjack (Ace + a picture card);
        The insurance bet is half the initial bet.
        Bet is paid 2:1
   */
   insurance(player) {
        //First card is always hidden, shown card a such the second one, on index 1.
        let dealer_card = this.dealer[1];
        //If the dealer card is an Ace
        if (dealer_card.val == "A") {
            //Set player insurance to half the bet of the initial hand, 
            // since it's done at the start of a round.
            player.insurance = (player.hands[0].bet / 2);

            return true; // Success
        }

        return false; //Something went wrong, or client is attempting to cheat.
   }
}

module.exports = Blackjack;