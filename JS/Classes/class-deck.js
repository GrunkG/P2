//Needs cards class
class Deck{
    constructor(deck){
        this.deck = deck;
    }
    //Makes a deck of cards
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
    //Able to add more decks
    addDeck(numberOfDecks){
        for (let i = 0; i < numberOfDecks; i++) {
            this.deck = this.deck.concat(Deck.getDeck);
        }
        return this.deck;
    }
    //Add shuffle method - Jonas har lavet dette, så læs det gerne kloge hoveder
    shuffleCards(){
        let shuffledDeck = [];
        for (let i = 0; i < this.deck.length; i++) {
            shuffledDeck[i] = this.deck[Math.floor(Math.random() * array.length)];
        }
        return shuffledDeck;
    }
}