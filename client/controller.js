var Controller = function () {
    var currentState;
    var listeners;

    function Controller() {
        listeners = {};
    }

    Controller.prototype.init = function () {
        var self = this;

        State.Loading.setText("Loading...");
        this.changeState(State.Loading);

        this.listen("resources_loaded", function () {
            State.Loading.setText("Connecting to game server...");
            Network.connect();
        });

        this.listen("network_connected", function () {
            self.notify("play_again");
        });

        this.listen("play_again", function () {
            State.Loading.setText("Waiting for opponents...");
            self.changeState(State.Loading);
            Network.challenge();
        });

        this.listen("network_error", function (reason) {
            State.Loading.setText("There was a problem while connecting to the game server. Please, try again later.");
        });

        this.listen("model_init", function () {
            self.changeState(State.Game);
        });

        this.listen("game_chicken", function () {
            State.Chicken.setText("Your opponent chickened out, sorry.");
            self.changeState(State.Chicken);
        });

        Resources.load();
    };

    Controller.prototype.changeState = function (newState) {
        if(currentState && currentState !== newState)
            currentState.exit();
        if(!currentState || currentState !== newState)
            newState.enter();
        currentState = newState;
    };

    Controller.prototype.getCurrentState = function () {
        return currentState;
    };

    Controller.prototype.listen = function (ev, callback) {
        if(!listeners[ev])
            listeners[ev] = [];
        listeners[ev].push(callback);
    };

    Controller.prototype.notify = function (ev, data) {
        for(var i in listeners[ev])
            listeners[ev][i](data);
    };

    return new Controller();
}();
