let test = new Card("K", "H", "default");
//test.printCard(200, 100, 200, document.body);
//test.printCardFaceDown(100, 90, 40, document.body);

for (let index = 0; index < 52; index++) {
    let newCard = new Card(Card.cardValue[randMinMax(0,12)], Card.cardSuit[randMinMax(0,3)], "default");
    newCard.printCard(randMinMax(80, 120), randMinMax(0, 1700), randMinMax(0, 800), document.body);
}

function randMinMax(min, max){
    return Math.floor(Math.random() * (max - min) + min);
}

