class card {
    constructor(type, value) {
        this.type = type;
        this.value = value; 
    }
}

class cardgame {
    constructor(decks) {
        super();
        this.decks = generateDeck(decks);
     }
     
     generateSuit(type) {
        let suit = [];
        for (let card = 1; card <= 13; card++) {
            if (card < 10) { 
                suit.push(this.generateCard(type,card));
                continue;
            }
            switch (card) {
                case 11:
                    suit.push(this.generateCard(type,'Jack'));
                    break;
                case 12:
                    suit.push(this.generateCard(type,'Queen'));
                    break;
                case 13:
                    suit.push(this.generateCard(type,'King'));
                    break;
                default: break;
            }
        }
        return suit;
     }

     generateCard(type, value) {
        let cardType = null;
        switch(type) {
            case 1: cardType = "Spades"; break;
            case 2: cardType = "Hearts"; break;
            case 3: cardType = "Diamonds"; break;
            case 4: cardType = "Clubs"; break;
            default: break;
        }        
        return new card(cardType, value);
     }

     generateDeck(num) { //Re-write as recursive function?
        let decks = [];
        if (num < 1) return null;
        for (let deck = 1; deck <= num; deck++) {
            for (let suit = 1; suit <= 4; suit++) {
                decks.push(this.generateSuit(suit));
            }
        }
        return decks;
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

class blackjack extends cardgames {
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
    blackjack
};

