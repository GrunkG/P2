let test = new Card("K", "H");
let test1 = new Card("K", "S");
let test2 = new Card("K", "D");
let test3 = new Card("K", "C");
// test.printCard(200, 100, 200, document.body);
// test.printCardFaceDown(100, 90, 40, document.body);

let newDeck = new Deck([test, test, test], "remote-player-p1__card-container");

//newDeck.addDeck(5);

test.printCardById("dealer__card-container");
test.printCardById("dealer__card-container");
test.printCardById("dealer__card-container");
test.printCardById("player__card-container");

newDeck.cardFront = "Simple Black";

newDeck.print();

newDeck.deck = [test, test1, test2, test3];

newDeck.update();


function randMinMax(min, max){
    return Math.floor(Math.random() * (max - min) + min);
}

