let cards = require('./cards_foundation');

class blackjack_player extends cards.player {
    constructor(hands, size) {
        super(hands, size);
    }

    doHit(hand) {
        if (this.hands[hand].length > this.hands[hand].handSize) return false;
        this.hands[hand].grab( this.game.drawCard() );
        return true;
    }

    doHold() {
        return false;
    }

    //doSplit()

    getHandValue(hand) {
        
    }
}

class blackjack extends cards.cardgame {
    constructor(decks, sqlconnector) {
        super(decks, false);
        this.sqlcon = sqlconnector;
        this.players = [];
        this.dealer = new blackjack_player(1,52); //1 hand, capable of holder 52 objects.
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


module.exports = blackjack;