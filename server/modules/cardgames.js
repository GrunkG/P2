class card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }
}

class cardgame {
    constructor(decks, bJokers) {
        this.jokers = bJokers; //Bool, true or false
        this.decks = this.generateDeck(decks);
     }
     
    generateSuit(suit) {
        let result = [];
        let suitSize = this.jokers ? 15 : 13;
        for (let card = 1; card <= suitSize; card++) {
            if (card <= 10 && card > 1) { 
                result.push(this.generateCard(suit,card));
                continue;
            }
            switch (card) {
                case 1:
                    result.push(this.generateCard(suit,'Ace'));
                    break;
                case 11:
                    result.push(this.generateCard(suit,'Jack'));
                    break;
                case 12:
                    result.push(this.generateCard(suit,'Queen'));
                    break;
                case 13:
                    result.push(this.generateCard(suit,'King'));
                    break;
                case 14:
                case 15:
                    result.push(this.generateCard(null,'Joker'));
                    break;
                default: break;
            }
        }
        return result;
    }

    generateCard(type, value) {
        let cardType = null;
        switch(type) {
            case 1: cardType = "Spades"; break;
            case 2: cardType = "Hearts"; break;
            case 3: cardType = "Diamonds"; break;
            case 4: cardType = "Clubs"; break;
            default: cardType = null; break;
        }        
        return new card(cardType, value);
    }

    generateDeck(num) { //Re-write as recursive function?
        let decks = [];
        if (num < 1) return null;
        for (let deck = 1; deck <= num; deck++) {
            for (let suit = 1; suit <= 4; suit++) {
                decks =  decks.concat(this.generateSuit(suit));
            }
        }
        return decks;
    }

    drawCard() {
        if (this.decks == null) return null;
        return this.decks.shift();
    }

    putInDeck(card) {
        if (card instanceof card) {
            this.decks.push(card);
            return true;
        }
        return false;
    }

    shuffleDeck() { //Using Fisher-Yates Shuffle - https://bost.ocks.org/mike/shuffle/
        var m = this.decks.length, t, i;

        // While there remain elements to shuffle…
        while (m) {
      
          // Pick a remaining element…
          i = Math.floor(Math.random() * m--);
      
          // And swap it with the current element.
          t = this.decks[m];
          this.decks[m] = this.decks[i];
          this.decks[i] = t;
        }
      
        return this.decks;
    }
}

class player extends cardgame {
    constructor(hands) {
        super();
        this.hands = hands;
        this.game = null;
    }
    //Spil håndtering
    join_game(bj_game) { 
        this.game = bj_game; 
        bj_game.addPlayer = this;
    }
    get getGameID() {}

    //Kort håndtering
    hit() {}
    hold() {}
    split() {}

}

class blackjack extends cardgame {
    constructor(decks, sqlconnector) {
        super();
        this.sqlcon = sqlconnector;
        this.players = [];
        this.dealer = null;
        this.decks = decks;
        this.ID = null;
        this.ready = true;
    }
    
    set addPlayer(val) {
        this.players[this.players.length] = val;
        this.updategame();
    }

    set queryHandler(result) {
        if (result != null && result != false) {
            if (this.ID == null && result.insertId > 0) this.ID = result.insertId;
            console.log(`Query returned: \n` + JSON.stringify(result));
        }
    }

    creategame() {
        let query = "INSERT INTO tbl_activegames (players) VALUES (NULL);";
        this.sqlcon.doQuery(query, this);
    }
    endgame() {
        if (!this.hasID) return false;
        let query = `DELETE FROM tbl_activegames WHERE ID = ${this.ID};`
        this.sqlcon.doQuery(query, this);
    }
    updategame() {
        if (!this.hasID) return false;
        let query = `UPDATE tbl_activegames SET players = ${this.players.length} WHERE ID = ${this.ID};`;
        this.sqlcon.doQuery(query, this.queryHandler);
    }
    handleGameRequests(req, res) {
        let command = req.url.split('/');
        if (command[2] == null) {
                res.StatusCode=404;
                res.end("\n");
                return false;
        }

        switch(command[2]) { //Implement a game func
            case "start":
                let test = {message: "TestMessage"};
                res.StatusCode=200;
                res.setHeader('Content-Type', 'application/json');
                res.write(JSON.stringify(test));
                res.end('\n');
                break;
            default:
                    res.StatusCode=404;
                    res.end("\n");
                    return false;
                break;
        }
    }

    getPlayers() {return this.players}
    hasID() {return (this.ID != null) ? true : false;}
}

module.exports =  {
    cardgame
};

