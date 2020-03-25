let test = new Card("K", "H");
// test.printCard(200, 100, 200, document.body);
// test.printCardFaceDown(100, 90, 40, document.body);

let newDeck = new Deck(Deck.getDeck);

//newDeck.addDeck(5);

test.printCardById("dealer__card-container");
test.printCardById("dealer__card-container");
test.printCardById("dealer__card-container");
test.printCardById("player__card-container");



//newDeck.printDeck("remote-player-p1__card-container");



function randMinMax(min, max){
    return Math.floor(Math.random() * (max - min) + min);
}

