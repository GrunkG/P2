//Needs cards class
class Deck{
    constructor(deck){
        this.deck = deck;
    }
    static get getDeck(){
        let deck = [];
        for (let i = 0; i < Card.cardSuit.length; i++) {
            for (let j = 0; j < Card.cardValue.length; j++) {
                let card = new Card(Card.cardValue[j], Card.cardSuit[i]);
                deck.push(card);
            }
        }
        return deck;
    }
    addDeck(numberOfDecks){
        for (let i = 0; i < numberOfDecks; i++) {
            this.deck = this.deck.concat(Deck.getDeck);
        }
        return this.deck;
    }
    //Add shuffle method
}