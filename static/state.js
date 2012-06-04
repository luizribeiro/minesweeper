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

var State = (function () {
    'use strict';
    /*global $, Controller, Model, Network, Resources */

    var Chicken, Loading, Game;

    Chicken = (function () {
        function Chicken() {
            $("#content").append("<div id=\"chicken\" class=\"message\"><div><p></p><button>Play Again</button></div></div>");
            $("#chicken button").click(function () {
                $(this).attr("disabled", "disabled");
                Controller.notify("play_again");
            });
        }

        Chicken.prototype.enter = function () {
            $("#chicken button").removeAttr("disabled");
            $("#chicken").stop().fadeIn("fast", function () {}).css("display", "table-cell");
            return this;
        };

        Chicken.prototype.exit = function () {
            $("#chicken").stop().fadeOut("fast", function () {});
            return this;
        };

        Chicken.prototype.setText = function (msg) {
            $("#chicken p").text(msg);
            return this;
        };

        return new Chicken();
    }());

    Loading = (function () {
        function Loading() {
            $("#content").append("<div id=\"loading\" class=\"message\"><div><p></p><img src=\"img/spinner.gif\" /></div></div>");
        }

        Loading.prototype.enter = function () {
            $("#loading").stop().fadeIn("fast", function () {}).css("display", "table-cell");
            return this;
        };

        Loading.prototype.exit = function () {
            $("#loading").stop().fadeOut("fast", function () {});
            return this;
        };

        Loading.prototype.setText = function (msg) {
            $("#loading p").text(msg);
            return this;
        };

        return new Loading();
    }());

    Game = (function () {
        var canvas, context,
            MAP_OFFSET_X = 12, MAP_OFFSET_Y = 69,
            COLORS = {
                1 : "#06266f",
                2 : "#078600",
                3 : "#a60400",
                4 : "#4c036e",
                5 : "#a63100",
                6 : "#04859d",
                7 : "#443425",
                8 : "#333333"
            };

        function clearCanvas() {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }

        function renderScoreboard() {
            context.drawImage(Model.getMyPhoto() && Model.getMyPhoto().complete ?
                Model.getMyPhoto() : Resources.getImage("anonymous"), MAP_OFFSET_X, 12);

            context.drawImage(Model.getOpPhoto() && Model.getOpPhoto().complete ?
                Model.getOpPhoto() : Resources.getImage("anonymous"), MAP_OFFSET_X + 16 * 24 - 50, 12);

            context.fillStyle = "#443425";
            context.font = "bold 14px sans-serif";
            context.textAlign = "left";
            context.fillText((Model.getMyInfo() && Model.getMyInfo().name) || "Anonymous", MAP_OFFSET_X + 5 + 50, 23 + 12 - 5);

            context.drawImage(Resources.getImage("blueflag"), MAP_OFFSET_X + 5 + 50, 30 + 12 - 5);
            context.fillStyle = "#443425";
            context.font = "bold 20px sans-serif";
            context.textAlign = "left";
            context.fillText(Model.getMyScore(), MAP_OFFSET_X + 29 + 50, 46 + 12 - 5);

            context.fillStyle = "#443425";
            context.font = "bold 14px sans-serif";
            context.textAlign = "right";
            context.fillText((Model.getOpInfo() && Model.getOpInfo().name) || "Anonymous", MAP_OFFSET_X + 16 * 24 - 50 - 5, 23 + 12 - 5);

            context.drawImage(Resources.getImage("redflag"), MAP_OFFSET_X + 16 * 24 - 23 - 50, 30 + 12 - 5);
            context.fillStyle = "#443425";
            context.font = "bold 20px sans-serif";
            context.textAlign = "right";
            context.fillText(Model.getOpScore(), MAP_OFFSET_X + 16 * 24 - 29 - 50, 46 + 12 - 5);

            context.fillStyle = "#443425";
            context.font = "bold 12px sans-serif";
            context.textAlign = "center";
            context.fillText(Model.isMyTurn() ? "It's your turn" : "Please wait...", canvas.width / 2, 43 + 12 - 5);
        }

        function renderMap() {
            var i, j, cell;

            for (i = 0; i < 16; i++) {
                for (j = 0; j < 16; j++) {
                    cell = Model.getMapCell(i, j);

                    if (cell === -3) {
                        context.drawImage(Resources.getImage("button"), MAP_OFFSET_X + 24 * i, MAP_OFFSET_Y + 24 * j);
                    } else {
                        context.drawImage(Resources.getImage("tile"), MAP_OFFSET_X + 24 * i, MAP_OFFSET_Y + 24 * j);
                        if (cell > 0 || cell === "A" || cell === "B") {
                            if (cell >= 1 && cell <= 8) {
                                context.fillStyle = COLORS[cell];
                                context.font = "bold 18px sans-serif";
                                context.textAlign = "center";
                                context.fillText(cell, MAP_OFFSET_X + 24 * i + 12, MAP_OFFSET_Y + 24 * j + 18);
                            } else if (cell === "A") {
                                context.drawImage(Resources.getImage("blueflag"), MAP_OFFSET_X + 24 * i + 3, MAP_OFFSET_Y + 24 * j + 2);
                            } else if (cell === "B") {
                                context.drawImage(Resources.getImage("redflag"), MAP_OFFSET_X + 24 * i + 3, MAP_OFFSET_Y + 24 * j + 2);
                            }
                        }
                    }
                }
            }
        }

        function renderCursors(myCursor, opCursor) {
            if (opCursor) {
                context.drawImage(Resources.getImage("redcursor"), MAP_OFFSET_X + 24 * opCursor.x, MAP_OFFSET_Y + 24 * opCursor.y);
            }
            if (myCursor) {
                context.drawImage(Resources.getImage("bluecursor"), MAP_OFFSET_X + 24 * myCursor.x, MAP_OFFSET_Y + 24 * myCursor.y);
            }
        }

        function render() {
            clearCanvas();
            renderScoreboard();
            renderMap();
            renderCursors(Model.getMyCursor(), Model.getOpCursor());
        }

        function renderAnnouncement(img, msg, snd) {
            $("#game canvas").stop().fadeTo("slow", 0.2, function () {});
            $("#announcement img").replaceWith($(img).clone());
            $("#announcement p").text(msg);
            $("#announcement button").removeAttr("disabled");
            $("#announcement").stop().fadeIn("slow", function () {
                if (snd !== undefined) {
                    snd.play();
                }
            }).css("display", "table-cell");
        }

        function ev_mousemove(ev) {
            var c = canvas.relMouseCoords(ev);

            if (!Model.isMyTurn()) {
                return;
            }

            c.x = Math.floor((c.x - MAP_OFFSET_X) / 24);
            c.y = Math.floor((c.y - MAP_OFFSET_Y) / 24);

            if (c.x >= 0 && c.x < 16 && c.y >= 0 && c.y < 16) {
                Model.setMyCursor(c);
            }
        }

        function ev_mousedown(ev) {
            var c = canvas.relMouseCoords(ev);

            if (!Model.isMyTurn()) {
                return;
            }

            c.x = Math.floor((c.x - MAP_OFFSET_X) / 24);
            c.y = Math.floor((c.y - MAP_OFFSET_Y) / 24);

            if (c.x >= 0 && c.x < 16 && c.y >= 0 && c.y < 16) {
                if (Model.getMapCell(c.x, c.y) !== -3) {
                    return;
                }
                Model.setMapCell(c.x, c.y, 0);
                Model.setMyTurn(false);
                Model.setMyCursor(c);
                Network.shoot(c);
                Resources.getSound("sndshoot").play();
            }
        }

        function Game() {
            $("#content").append("<div id=\"game\"></div>");
            $("#game").append("<canvas id=\"canvas\" width=\"408\" height=\"465\"></canvas>");
            $("#game").append("<div id=\"announcement\"><div><img /><p></p><button>Play Again</button></div></div>");

            canvas = $("#game canvas").get(0);
            context = canvas.getContext("2d");

            canvas.addEventListener("mousemove", ev_mousemove, false);
            canvas.addEventListener("mousedown", ev_mousedown, false);
            canvas.onselectstart = function () { return false; };

            Controller.listen("model_init", render);
            Controller.listen("model_updated", render);
            Controller.listen("game_win", function () {
                renderAnnouncement(Resources.getImage("win"), "You Win!", Resources.getSound("sndwin"));
            });
            Controller.listen("game_lose", function () {
                renderAnnouncement(Resources.getImage("lose"), "You Lose!", Resources.getSound("sndlose"));
            });
            Controller.listen("game_draw", function () {
                renderAnnouncement(Resources.getImage("draw"), "Draw!");
            });

            $("#announcement button").click(function () {
                $(this).attr("disabled", "disabled");
                Controller.notify("play_again");
            });
        }

        Game.prototype.enter = function () {
            $("#announcement").hide();
            $("#game canvas").css({ opacity : 1.0 }).show();
            $("#game").stop().fadeIn("slow", function () {});
            return this;
        };

        Game.prototype.exit = function () {
            $("#game").stop().fadeOut("slow", function () {});
            return this;
        };

        return new Game();
    }());

    return {
        Chicken : Chicken,
        Loading : Loading,
        Game : Game,
    };
}());
