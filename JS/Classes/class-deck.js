//Needs cards class -- Use this class to store player decks

class Deck{
    constructor(cards){
        this.cards = cards;
        this.hold = false;
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
}
