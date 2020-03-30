class Game{
    constructor(player = this.getPlayer, dealer = this.getDealer, remotes = []){
        this.player = player; //Class player
        this.dealer = dealer; //Class player
        this.remotes = remotes; //Array of class player
    }
    static get getPlayer(){
        return new Player(`player`, new Deck([]));
    }
    static get getDealer(){
        return new Player(`dealer`, new Deck([]));
    }
    //Adds a single remote player to the array of remotes
    addRemote(){
        this.remotes[this.remotes.length] = new RemotePlayer(`remote-player-p${this.remotes.length+1}`, new Deck([]));
        this.remotes[this.remotes.length - 1].initialize();
    }
    //Method that creates multiple remotes
    addRemotes(amount){
        for (let i = 0; i < amount; i++) {
            this.addRemote();      
        }
    }
    //Method to print all remotes
    //Method to print everything at once
}