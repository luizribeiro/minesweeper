'use strict';

var config = require("./config");
var model = require("./model");
var controller = require("./controller");

var http = require("http");
var fs = require("fs");

var app;
var io;

function onRequest(request, response) {
    var filename, url;

    url = request.url.replace(config.APP_PATH, "/");

    if (url === "/") {
        filename = config.RESOURCES_PATH + "/index.html";
    } else {
        filename = config.RESOURCES_PATH + url;
    }

    fs.readFile(filename, function (err, data) {
        if (err) {
            response.writeHead(500);
            return response.end("Error loading resources.");
        }

        response.writeHead(200);
        response.end(data);
    });
}

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
    app = http.createServer(onRequest);
    io = require("socket.io").listen(app);
    io.set("transports", config.TRANSPORTS);
    io.set("log level", 1);
    app.listen(config.HTTP_PORT);

    io.sockets.on("connection", onConnect);

    console.log("Server has started on port " + config.HTTP_PORT);
}

exports.start = start;
