//Needs cards class -- Use this class to store player decks

class Deck{
    constructor(cards){
        this.cards = cards;
    }
    //Print all cards in the card container of id
    print(id, cardFront, containerId = "0"){
        this.cards.forEach(card => card.printCardById(id + "__card-container" + containerId, cardFront));
        return this;
    }
    //Removes all printed cards in the card container of id
    clear(id, containerId = "0"){
        document.getElementById(id + "__card-container" + containerId).innerHTML = "";
        return this;
    }
    //Updates a printed deck of cards to match the current deck
    update(id, cardFront, containerId = "0"){
        this.clear(id, containerId).print(id, cardFront, containerId);
    }
    //Makes a deck of cards
    // static get getDeck(){
    //     let deck = [];
    //     for (let i = 0; i < Card.cardSuit.length; i++) {
    //         for (let j = 0; j < Card.cardValue.length; j++) {
    //             let card = new Card(Card.cardValue[j], Card.cardSuit[i]);
    //             deck.push(card);
    //         }
    //     }
    //     return deck;
    // }
    //Able to add more decks
    // addDeck(numberOfDecks){
    //     for (let i = 0; i < numberOfDecks; i++) {
    //         this.cards = this.cards.concat(Deck.getDeck);
    //     }
    //     return this.cards;
    // }
    //Shuffle method - Skal denne ikke fjerne det kort den finder i this.cards så den ikke kan blive taget flere gange?
    // shuffleCards(){
    //     let shuffledDeck = [];
    //     for (let i = 0; i < this.cards.length; i++) {
    //         shuffledDeck[i] = this.cards[Math.floor(Math.random() * array.length)];
    //     }
    //     return shuffledDeck;
    // }
}
