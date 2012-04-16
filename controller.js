var Controller = function () {
    var currentState;
    var listeners;

    function Controller() {
        listeners = {};
    }

    Controller.prototype.init = function () {
        var self = this;

        State.Message.setSpinner(true);
        State.Message.setText("Loading...");
        this.changeState(State.Message);

        this.listen("resources_loaded", function () {
            State.Message.setSpinner(true);
            State.Message.setText("Connecting to game server...");
            Network.connect();
        });

        this.listen("network_connected", function () {
            State.Message.setSpinner(true);
            State.Message.setText("Waiting for opponents...");
        });

        this.listen("network_error", function (reason) {
            State.Message.setSpinner(false);
            State.Message.setText("There was a problem while connecting to the game server. Please, try again later.");
        });

        this.listen("model_init", function () {
            self.changeState(State.Game);
        });

        this.listen("game_chicken", function () {
            State.Message.setSpinner(false);
            State.Message.setText("Your opponent chickened out, sorry.");
            self.changeState(State.Message);
        });

        Resources.load();
    };

    Controller.prototype.changeState = function (newState) {
        if(currentState)
            currentState.exit();
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
