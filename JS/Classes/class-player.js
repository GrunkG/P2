class Player{
    constructor(id, hands = [new Deck([])], cardFront = "Default", cardBack = "default") { //Hands is an array of card arrays
        this.hands = hands;
        this.cardFront = cardFront;
        this.cardBack = cardBack;
        this.id = id;
    }
    printHand(index) {
        this.hands[index].update(this.id, this.cardFront, index.toString());
    }
    printHands(){
        for(let i = 0; i < this.hands.length; i++){
            this.printHand(i);
        }
    }
    splitHand(index) {
        this.hands[this.hands.length] = new Deck([this.hands[index].cards.pop()]);
        this.initializeHand(this.hands.length - 1);
        this.printHands();
    }
    initializeHand(index) {
        let parent = document.getElementById(this.id + "__card-container");
        let newHand = document.createElement("div");
        let newSum = document.createElement("span");

        newHand.setAttribute("id", this.id + "__card-container" + index.toString());
        newSum.setAttribute("id", this.id + "__card-sum" + index.toString());
        newSum.setAttribute("class", this.id + "__card-sum");

        parent.appendChild(newHand);
        parent.appendChild(newSum);
    }

}

class RemotePlayer extends Player{
    //Method to create the html of a remote player
    addToHtml() {
        //Creates some like this:
        // <div class="remote-player">
        //         <span class="remote-player__title">P1</span>
        //         <div class="remote-player__card-container" id="remote-player-p1__card-container">
        //             <div id="remote-player-p1__card-container0"></div>
        //         </div>
        //         <span class="remote-player__card-sum" id="remote-player-p1__card-sum">42</span>
        // </div>
        let parent = document.getElementById("blackjack-container");
        let newRemote = document.createElement("div");
        let newRemoteTitle = document.createElement("span");
        let newRemoteCardContainer = document.createElement("div");
        let newRemoteInnerCardContainer = document.createElement("div");
        let newRemoteCardSum = document.createElement("span");

        newRemote.setAttribute("class", "remote-player");

        newRemoteTitle.setAttribute("class", "remote-player__title"); //Title container
        newRemoteTitle.textContent = `${this.id.slice(14)}`;
        newRemote.appendChild(newRemoteTitle);

        newRemoteCardContainer.setAttribute("class", "remote-player__card-container"); //Card container
        newRemoteCardContainer.setAttribute("id", `${this.id}__card-container`);
        newRemote.appendChild(newRemoteCardContainer);

        newRemoteInnerCardContainer.setAttribute("id", this.id + "__card-container0");
        newRemoteCardContainer.appendChild(newRemoteInnerCardContainer);

        newRemoteCardSum.setAttribute("class", "remote-player__card-sum"); //Sum container
        newRemoteCardSum.setAttribute("id", `${this.id}__card-sum0`);
        newRemoteCardContainer.appendChild(newRemoteCardSum);

        parent.appendChild(newRemote);

        return this;
    }
    initialize(index){
        this.addToHtml();
        this.cardFront = "Simple Black";
        this.printHand(index);
    }
}