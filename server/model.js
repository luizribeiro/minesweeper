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

var Player = (function () {
    function Player(socket) {
        this.socket = socket;
    }

    Player.prototype.getSocket = function () {
        return this.socket;
    };

    Player.prototype.getId = function () {
        return this.getSocket().id;
    };


    Player.prototype.equals = function (otherPlayer) {
        return this.getId() === otherPlayer.getId();
    };

    return Player;
}());

var Match = (function () {
    function Match(id, player1, player2) {
        var i, j, dx, dy, x, y;

        this.id = id;
        this.player1 = player1;
        this.player2 = player2;

        this.score1 = 0;
        this.score2 = 0;

        this.turn = 0;

        this.map = [];
        this.mine = [];
        this.revealed = [];

        // create maps
        for (i = 0; i < 16; i++) {
            this.map.push([]);
            this.mine.push([]);
            this.revealed.push([]);

            for (j = 0; j < 16; j++) {
                this.map[i].push(0);
                this.mine[i].push(0);
                this.revealed[i].push(0);
            }
        }

        // place mines
        for (i = 0; i < config.NUM_MINES; i++) {
            x = Math.floor(Math.random() * 16);
            y = Math.floor(Math.random() * 16);

            if (this.mine[x][y] === 1) {
                i--;
            } else {
                this.mine[x][y] = 1;
                for (dx = -1; dx <= 1; dx++) {
                    for (dy = -1; dy <= 1; dy++) {
                        if (x + dx >= 0 && x + dx < 16 && y + dy >= 0 && y + dy < 16
                                && this.mine[x + dx][y + dy] === 0) {
                            this.map[x + dx][y + dy]++;
                        }
                    }
                }
            }
        }

        this.minesLeft = config.NUM_MINES;
    }

    Match.prototype.getId = function () {
        return this.id;
    };

    Match.prototype.getScore = function (player) {
        if (player.equals(this.player1)) {
            return this.score1;
        }

        if (player.equals(this.player2)) {
            return this.score2;
        }

        return null;
    };

    Match.prototype.getOpponent = function (player) {
        if (player.equals(this.player1)) {
            return this.player2;
        }

        if (player.equals(this.player2)) {
            return this.player1;
        }

        return null;
    };

    Match.prototype.getPlayer1 = function () {
        return this.player1;
    };

    Match.prototype.getPlayer2 = function () {
        return this.player2;
    };

    Match.prototype.getCurrentPlayer = function () {
        return this.turn % 2 === 0 ? this.player1 : this.player2;
    };

    Match.prototype.isPlayersTurn = function (player) {
        return this.getCurrentPlayer().equals(player);
    };

    Match.prototype.hasEnded = function () {
        return this.minesLeft === 0
            || this.score1 > this.score2 + this.minesLeft
            || this.score2 > this.score1 + this.minesLeft;
    };

    Match.prototype.shoot = function (player, x, y) {
        var stateDelta1 = [], stateDelta2 = [], floodState;

        if (x < 0 || x >= 16 || y < 0 || y >= 16
                || this.revealed[x][y] === 1
                || !this.isPlayersTurn(player)) {
            return;
        }

        if (this.mine[x][y] === 0) {
            this.turn++;
        }

        floodState = function (self, x, y) {
            var dx, dy;

            self.revealed[x][y] = 1;

            if (self.mine[x][y] === 1) {
                stateDelta1.push({ x : x, y : y, z : player.equals(self.player1) ? "A" : "B" });
                stateDelta2.push({ x : x, y : y, z : player.equals(self.player2) ? "A" : "B" });

                if (player.equals(self.player1)) {
                    self.score1++;
                } else {
                    self.score2++;
                }

                self.minesLeft--;

                return;
            }

            stateDelta1.push({ x : x, y : y, z : self.map[x][y]});
            stateDelta2.push({ x : x, y : y, z : self.map[x][y]});

            if (self.map[x][y] === 0) {
                for (dx = -1; dx <= 1; dx++) {
                    for (dy = -1; dy <= 1; dy++) {
                        if (x + dx >= 0 && x + dx < 16 && y + dy >= 0 && y + dy < 16
                                && self.revealed[x + dx][y + dy] === 0) {
                            floodState(self, x + dx, y + dy);
                        }
                    }
                }
            }
        };

        floodState(this, x, y);

        return {
            stateDelta1 : stateDelta1,
            stateDelta2 : stateDelta2
        };
    };

    return Match;
}());

exports.Match = Match;
exports.Player = Player;
