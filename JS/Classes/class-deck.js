//Needs cards class -- Use this class to store player decks
class Deck{
    constructor(cards, cardFront = "Default", cardBack = "default"){
        this.cards = cards;
        this.cardFront = cardFront;
        this.cardBack = cardBack;
    }
    //Makes a deck of cards
    static get getDeck(){
        let deck = [];
        for (let i = 0; i < Card.cardSuit.length; i++) {
            for (let j = 0; j < Card.cardValue.length; j++) {
                let card = new Card(Card.cardValue[j], Card.cardSuit[i], cardFront, cardBack);
                deck.push(card);
            }
        }
        return deck;
    }
    //Able to add more decks
    addDeck(numberOfDecks){
        for (let i = 0; i < numberOfDecks; i++) {
            this.cards = this.cards.concat(Deck.getDeck);
        }
        return this.cards;
    }
    //Add shuffle method - Jonas har lavet dette, så læs det gerne kloge hoveder
    shuffleCards(){
        let shuffledDeck = [];
        for (let i = 0; i < this.cards.length; i++) {
            shuffledDeck[i] = this.cards[Math.floor(Math.random() * array.length)];
        }
        return shuffledDeck;
    }
    //Print all cards in the card container of id
    print(id){
        this.cards.forEach(card => card.printCardById(id + "__card-container", this.cardFront));
        return this;
    }
    //Removes all printed cards in the card container of id
    clear(id){
        document.getElementById(id + "__card-container").innerHTML = "";
        return this;
    }
    //Updates a printed deck of cards to match the current deck
    update(id){
        this.clear(id).print(id);
    }
}