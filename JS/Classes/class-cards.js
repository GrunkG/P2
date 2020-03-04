//Value from 2-10 J Q K A, suit S, H, C or D, back = img name for back
class Card {
    constructor(value, suit, back) {
        this.value = value;
        this.suit = suit;
        this.back = back;
    }
    static get cardSuit(){
        return ["S", "H", "C", "D"];
    }
    static get cardValue(){
        return ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    }

    //Size = width of card, posX = x position in html, posY = y position
    printCard(size, posX, posY, htmlLocation) {
        let card = document.createElement("img");
        card.src = `/Git/Resources/Cards/${this.value}${this.suit}.png`; //e.g. "/Resources/Cards/Default/spades-ace.png"
        let cssStyle = `width: ${size}px; position: absolute; left: ${posX}px; top: ${posY}px;`;
        card.style.cssText = cssStyle;
        htmlLocation.appendChild(card);
    }
    printCardFaceDown(size, posX, posY, htmlLocation) { //Could be part of printCard
        let card = document.createElement("img");
        card.src = `/Git/Resources/Cards/${this.back}.png`;
        card.style.width = `${size}px`
        let cssStyle = `width: ${size}px; position: absolute; left: ${posX}px; top: ${posY}px;`;
        card.style.cssText = cssStyle;
        htmlLocation.appendChild(card);
    }
}