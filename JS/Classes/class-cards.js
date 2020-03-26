//Value from 2-10 J Q K A, suit S, H, C or D, back = img name for back
class Card {
    constructor(value, suit) {
        this.value = value;
        this.suit = suit;
    }
    static get cardSuit(){
        return ["S", "H", "C", "D"];
    }
    static get cardValue(){
        return ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    }

    //Size = width of card, posX = x position in html, posY = y position
    printCard(htmlLocation, front = "Default") {
        let card = document.createElement("img");
        card.src = `../Resources/Cards/Front/${front}/${this.value}${this.suit}.png`; //e.g. "/Resources/Cards/Default/spades-ace.png"
        //let cssStyle = `height: inherit`
        //card.style.cssText = cssStyle;
        htmlLocation.appendChild(card);
    }
    printCardById(htmlId, front = "Default"){
        this.printCard(document.getElementById(htmlId), front);
    }
    printCardFaceDown(htmlLocation, back = "default") { //Could be part of printCard
        let card = document.createElement("img");
        card.src = `../Resources/Cards/Back/${back}.png`;
        //card.style.width = `${size}px`
        //let cssStyle = `height: auto`;
        //card.style.cssText = cssStyle;
        htmlLocation.appendChild(card);
    }
}