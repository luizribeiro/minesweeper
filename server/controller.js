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
