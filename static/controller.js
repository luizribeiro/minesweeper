/*
Copyright (c) 2012 Luiz Ribeiro <luizribeiro@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var Controller = (function () {
    'use strict';
    /*global Network, Resources, State */

    var currentState, listeners;

    function Controller() {
        listeners = {};
    }

    Controller.prototype.init = function () {
        var self = this;

        State.Loading.setText("Loading...");
        this.changeState(State.Loading);

        this.listen("resources_loaded", function () {
            FB.getLoginStatus(function (response) {
                if (response.status === "connected") {
                    State.Loading.setText("Connecting to game server...");
                    Network.connect();
                } else {
                    window.location = "/auth/facebook";
                }
            });
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
        if (currentState && currentState !== newState) {
            currentState.exit();
        }
        if (!currentState || currentState !== newState) {
            newState.enter();
        }
        currentState = newState;
    };

    Controller.prototype.getCurrentState = function () {
        return currentState;
    };

    Controller.prototype.listen = function (ev, callback) {
        if (!listeners[ev]) {
            listeners[ev] = [];
        }
        listeners[ev].push(callback);
    };

    Controller.prototype.notify = function (ev, data) {
        var i;
        for (i in listeners[ev]) {
            if (listeners[ev].hasOwnProperty(i)) {
                listeners[ev][i](data);
            }
        }
    };

    return new Controller();
}());
