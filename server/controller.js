'use strict';

var model = require("./model");

var onlinePlayers = {};
var playerMatch = {};
var matches = {};
var availablePlayers = {};
var gameCount = 0;

function getMatch(player) {
    var matchId = playerMatch[player.getId()];

    if (matchId === undefined) {
        return null;
    }

    return matches[matchId];
}

function isPlaying(player) {
    return getMatch(player) !== null;
}

function isChallenging(player) {
    return availablePlayers[player.getId()] === true;
}

function connectPlayer(socket) {
    var player = new model.Player(socket);
    onlinePlayers[player.getId()] = player;
    return player;
}

function disconnectPlayer(player) {
    delete availablePlayers[player.getId()];
    delete onlinePlayers[player.getId()];
}

function challenge(player) {
    if (isChallenging(player) || isPlaying(player)) {
        return false;
    }

    availablePlayers[player.getId()] = true;

    return true;
}

function makeMatch() {
    var p, player1, player2;

    for (p in availablePlayers) {
        if (availablePlayers.hasOwnProperty(p)) {
            if (player1 === undefined) {
                player1 = p;
            } else if (player2 === undefined) {
                player2 = p;
                break;
            }
        }
    }

    if (player1 !== undefined && player2 !== undefined) {
        delete availablePlayers[player1];
        delete availablePlayers[player2];

        matches[gameCount] = new model.Match(gameCount, onlinePlayers[player1], onlinePlayers[player2]);
        playerMatch[player1] = gameCount;
        playerMatch[player2] = gameCount;
        return matches[gameCount++];
    }
}

function endMatch(match) {
    delete playerMatch[match.getPlayer1().getId()];
    delete playerMatch[match.getPlayer2().getId()];
    delete matches[match.getId()];
}

exports.connectPlayer = connectPlayer;
exports.disconnectPlayer = disconnectPlayer;
exports.makeMatch = makeMatch;
exports.endMatch = endMatch;
exports.getMatch = getMatch;
exports.isPlaying = isPlaying;
exports.challenge = challenge;
