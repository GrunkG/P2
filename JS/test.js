let game = new Game();

let test = new Card("K", "H");
let testCards = new Deck([test, test, test, test]);
let testCards2 = new Deck([test, test, test]);

game.addRemotes(8);

game.player.hands[0] = testCards;

game.dealer.hands[0] = testCards;

game.remotes[0].hands[0] = testCards2;

game.updateScreen();

//game.toggleWinScreen();

