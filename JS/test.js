let test = new Card("K", "H");
// test.printCard(200, 100, 200, document.body);
// test.printCardFaceDown(100, 90, 40, document.body);

let newDeck = new Deck(Deck.getDeck, "remote-player-p1__card-container");

//newDeck.addDeck(5);

test.printCardById("dealer__card-container");
test.printCardById("dealer__card-container");
test.printCardById("dealer__card-container");
test.printCardById("player__card-container");



newDeck.printDeck();
newDeck.clearDeck();


function randMinMax(min, max){
    return Math.floor(Math.random() * (max - min) + min);
}

