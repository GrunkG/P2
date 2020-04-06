class Game{
    constructor(player = Game.getPlayer, dealer = Game.getDealer, remotes = []){
        this.player = player; //Class player
        this.dealer = dealer; //Class player
        this.remotes = remotes; //Array of class player
    }
    static get getPlayer(){
        return new Player(`player`);
    }
    static get getDealer(){
        return new Player(`dealer`);
    }
    //Adds a single remote player to the array of remotes
    addRemote(){
        this.remotes[this.remotes.length] = new RemotePlayer(`remote-player-p${this.remotes.length+1}`);
        this.remotes[this.remotes.length - 1].initialize(0);
    }
    //Method that creates multiple remotes
    addRemotes(amount){
        for (let i = 0; i < amount; i++) {
            this.addRemote();      
        }
    }
    //Method to print all remotes
    printRemotes(){
        this.remotes.forEach(remote => remote.printHands());
    }
    //Method to print everything at once
    updateScreen(){
        this.printRemotes();
        this.player.printHands();
        this.dealer.printHands();
    }
}