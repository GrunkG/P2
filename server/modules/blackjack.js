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
    
    getCardValue(card) {
        let Card = card.value;
        if (/[0-9]/.test(Card)) return Card;
        switch(Card) {
            case "Ace":
                return "Ace";
            case "Jack":
            case "Queen":
            case "King":
                return 10;
            default: break;
        }
        return 0;
    }

    creategame() {
        let query = "INSERT INTO activegames (players) VALUES (NULL);";
        this.sqlcon.doQuery(query, this);
    }
    endgame() {
        if (!this.hasID) return false;
        let query = `DELETE FROM activegames WHERE ID = ${this.ID};`
        this.sqlcon.doQuery(query, this);
    }
    updategame() {
        if (!this.hasID) return false;
        let query = `UPDATE activegames SET players = ${this.players.length} WHERE ID = ${this.ID};`;
        this.sqlcon.doQuery(query, this);
    }

    set playerConnect(player) {

    }

    handleGameRequests(req, res) { //Web-request handling
        let command = req.url.split('/');
        if (command[2] == null) {
                res.StatusCode=404;
                res.end("\n");
                return false;
        }

        switch(command[2]) { //Implement a game func
            case "start":
                let secret = command[3];
                let test = {secret: secret, action: null, currency: 500};
                res.StatusCode=200;
                res.setHeader('Content-Type', 'application/json');
                res.write(JSON.stringify(test));
                res.end('\n');
                break;
            case "hit":
            case "hold":
            //case "split":
            case "bet":
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