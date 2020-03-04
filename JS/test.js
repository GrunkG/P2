let test = new Card("K", "H", "default");
//test.printCard(200, 100, 200, document.body);
//test.printCardFaceDown(100, 90, 40, document.body);

let newDeck = new Deck(Deck.getDeck);

// for (let index = 0; index < newDeck.deck.length; index++) {
//     newDeck.deck[index].printCard(100, 120 * index % 1560 + 100, 200 * Math.floor(index * 1/13 + 1) - 100, document.body);
// }

function randMinMax(min, max){
    return Math.floor(Math.random() * (max - min) + min);
}

