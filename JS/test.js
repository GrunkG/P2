let test = new Card("K", "H");
// test.printCard(200, 100, 200, document.body);
// test.printCardFaceDown(100, 90, 40, document.body);

let newDeck = new Deck([test, test, test], "remote-player-p1__card-container");

//newDeck.addDeck(5);

test.printCardById("dealer__card-container");
test.printCardById("dealer__card-container");
test.printCardById("dealer__card-container");
test.printCardById("player__card-container");



newDeck.print();

newDeck.deck = [test, test, test, test];

newDeck.update();


function randMinMax(min, max){
    return Math.floor(Math.random() * (max - min) + min);
}

