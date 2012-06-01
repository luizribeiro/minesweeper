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

'use strict';

var config = require("./config");
var model = require("./model");
var controller = require("./controller");

var faceplate = require("faceplate");
var express = require("express");
var sio = require("socket.io");
var fs = require("fs");

var app;
var io;

function announceOpponents(match) {
    match.getPlayer1().getSocket().emit("opponent", match.getPlayer2().getId());
    match.getPlayer2().getSocket().emit("opponent", match.getPlayer1().getId());
}

function announceTurns(match) {
    var curPlayer = match.getCurrentPlayer();
    curPlayer.getSocket().emit("turn", []);
    match.getOpponent(curPlayer).getSocket().emit("wait", []);
}

function announceWinner(match) {
    var player1 = match.getPlayer1(), player2 = match.getPlayer2();
    if(match.getScore(player1) > match.getScore(player2)) {
        player1.getSocket().emit("win", []);
        player2.getSocket().emit("lose", []);
    } else if(match.getScore(player1) < match.getScore(player2)) {
        player1.getSocket().emit("lose", []);
        player2.getSocket().emit("win", []);
    } else {
        player1.getSocket().emit("draw", []);
        player2.getSocket().emit("draw", []);
    }
}

function onConnect(socket) {
    var player = controller.connectPlayer(socket);

    console.log("Player " + player.getId() + " just connected.");

    socket.on("challenge", function (data) {
        if (controller.challenge(player)) {
            console.log("Player " + player.getId() + " is challenging.");
            var match = controller.makeMatch();
            if (match !== undefined) {
                console.log("Creating match between " + player.getId() + " and " + match.getOpponent(player).getId());
                announceOpponents(match);
                announceTurns(match);
            }
        }
    });

    socket.on("shoot", function (data) {
        var match = controller.getMatch(player),
            deltas = match.shoot(player, data.x, data.y);
        if (deltas !== undefined) {
            match.getPlayer1().getSocket().emit("state", deltas.stateDelta1);
            match.getPlayer2().getSocket().emit("state", deltas.stateDelta2);
            match.getOpponent(player).getSocket().emit("cursor", data);

            if (match.hasEnded()) {
                console.log("Ending match between " + player.getId() + " and " + match.getOpponent(player).getId());
                announceWinner(match);
                controller.endMatch(match);
            } else {
                announceTurns(match);
            }
        }
    });

    socket.on("disconnect", function (data) {
        console.log("Player " + player.getId() + " disconnected.");
        if (controller.isPlaying(player)) {
            var match = controller.getMatch(player);
            match.getOpponent(player).getSocket().emit("chicken", []);
            controller.endMatch(match);
        }
        controller.disconnectPlayer(player);
    });
}

function start() {
    app = express.createServer(
            express.logger(),
            express.static(config.RESOURCES_PATH),
            express.bodyParser(),
            express.cookieParser(),
            express.session({ secret : config.SESSION_SECRET }),
            faceplate.middleware({
                app_id : config.FACEBOOK_APP_ID,
                secret : config.FACEBOOK_SECRET
            }));
    io = sio.listen(app);
    io.set("transports", config.TRANSPORTS);
    io.set("log level", 1);
    app.listen(config.HTTP_PORT);

    io.sockets.on("connection", onConnect);

    console.log("Server has started on port " + config.HTTP_PORT);
}

exports.start = start;