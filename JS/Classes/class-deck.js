//Needs cards class -- Use this class to store the players' decks
class Deck{
    constructor(deck, htmlId){
        this.deck = deck;
        this.htmlId = htmlId;
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
    //Print all cards in a deck within the container with the id htmlId
    print(){
        this.deck.forEach(card => card.printCardById(this.htmlId));
    }
    clear(){
        document.getElementById(this.htmlId).innerHTML = "";
    }
    update(){
        this.clear();
        this.print();
    }
}