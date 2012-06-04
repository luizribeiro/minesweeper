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

var Network = (function () {
    'use strict';
    /*global Controller, io, Model, Resources, window */

    var socket;

    function Network() {
    }

    Network.prototype.connect = function () {
        var host = window.location.hostname || "localhost";
        socket = io.connect();

        socket.on("connect", function (data) {
            Controller.notify("network_connected");
        });

        socket.on("error", function (data) {
            Controller.notify("network_error", data);
        });

        socket.on("opponent", function (data) {
            Model.init();
            if (data.fbid !== -1) {
                FB.api("/" + data.fbid, function(response) {
                    Model.setOpInfo(response);
                });
            }
        });

        socket.on("turn", function (data) {
            Model.setMyTurn(true);
        });

        socket.on("wait", function (data) {
            Model.setMyTurn(false);
        });

        socket.on("state", function (data) {
            Model.updateMap(data);
            Resources.getSound("sndshoot").play();
        });

        socket.on("chicken", function (data) {
            Controller.notify("game_chicken");
        });

        socket.on("win", function (data) {
            Controller.notify("game_win");
        });

        socket.on("lose", function (data) {
            Controller.notify("game_lose");
        });

        socket.on("draw", function (data) {
            Controller.notify("game_draw");
        });

        socket.on("cursor", function (data) {
            Model.setOpCursor(data);
        });
    };

    Network.prototype.shoot = function (cursor) {
        socket.emit("shoot", cursor);
    };

    Network.prototype.challenge = function (cursor) {
        socket.emit("challenge", []);
    };

    return new Network();
}());
