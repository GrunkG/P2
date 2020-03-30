class Player{
    constructor(id, deck = []) {
        this.deck = deck;
        this.id = id;
    }
    printDeck() {
        this.deck.update(this.id);
    }


}

class RemotePlayer extends Player{
    //Method to create the html of a remote player
    addToHtml() {
        //Creates some like this:
        // <div class="remote-player">
        //         <span class="remote-player__title">P1</span>
        //         <div class="remote-player__card-container" id="remote-player-p1__card-container"></div>
        //         <span class="remote-player__card-sum" id="remote-player-p1__card-sum">42</span>
        // </div>
        let parent = document.getElementById("blackjack-container");
        let newRemote = document.createElement("div");
        let newRemoteTitle = document.createElement("span");
        let newRemoteCardContainer = document.createElement("div");
        let newRemoteCardSum = document.createElement("span");

        newRemote.setAttribute("class", "remote-player");

        newRemoteTitle.setAttribute("class", "remote-player__title"); //Title container
        newRemoteTitle.textContent = `${this.id.slice(14)}`;
        newRemote.appendChild(newRemoteTitle);

        newRemoteCardContainer.setAttribute("class", "remote-player__card-container"); //Card container
        newRemoteCardContainer.setAttribute("id", `${this.id}__card-container`);
        newRemote.appendChild(newRemoteCardContainer);

        newRemoteCardSum.setAttribute("class", "remote-player__card-sum"); //Sum container
        newRemoteCardSum.setAttribute("id", `${this.id}__card-sum`);
        newRemote.appendChild(newRemoteCardSum);

        parent.appendChild(newRemote);

        return this;
    }
    initialize(){
        this.addToHtml();
        this.deck.cardFront = "Simple Black";
        this.printDeck();
    }
}