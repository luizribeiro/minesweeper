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
            MAP_OFFSET_X = 0, MAP_OFFSET_Y = 0,
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

        function renderScoreboard() {
            $("#myprofile").css({ opacity : Model.isMyTurn() ? 1.0 : 0.5 });
            $("#myprofile .name").text((Model.getMyInfo() && Model.getMyInfo().name) || "Anonymous");
            $("#myprofile .picture").replaceWith($(
                        Model.getMyPhoto() && Model.getMyPhoto().complete
                        ? Model.getMyPhoto()
                        : Resources.getImage("anonymous")
                        ).clone().addClass("picture"));
            $("#myprofile .value").text(Model.getMyScore());

            $("#opprofile").css({ opacity : !Model.isMyTurn() ? 1.0 : 0.5 });
            $("#opprofile .name").text((Model.getOpInfo() && Model.getOpInfo().name) || "Anonymous");
            $("#opprofile .picture").replaceWith($(
                        Model.getOpPhoto() && Model.getOpPhoto().complete
                        ? Model.getOpPhoto()
                        : Resources.getImage("anonymous")
                        ).clone().addClass("picture"));
            $("#opprofile .value").text(Model.getOpScore());
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
            renderScoreboard();
            renderMap();
            renderCursors(Model.getMyCursor(), Model.getOpCursor());
        }

        function renderAnnouncement(img, msg, snd) {
            $("#board").stop().fadeTo("slow", 0.2, function () {});
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

            $("#game").append("<div id=\"board\"></div>");
            $("#game").append("<div id=\"announcement\"><div><img /><p></p><button>Play Again</button></div></div>");

            $("#board").append("<div id=\"scoreboard\"></div>");
            $("#board").append("<canvas id=\"canvas\" width=\"384\" height=\"384\"></canvas>");

            $("#scoreboard").append("<div class=\"profile\" id=\"myprofile\"><img class=\"picture\" src=\"img/anonymous.png\" /><div class=\"inner\"><p class=\"name\">Anonymous</p><p class=\"score\"><img src=\"img/blueflag.png\" /> <span class=\"value\">0</span></p></div></div>");
            $("#scoreboard").append("<div class=\"status\"><p class=\"countdown\"></p></div>");
            $("#scoreboard").append("<div class=\"profile\" id=\"opprofile\"><img class=\"picture\" src=\"img/anonymous.png\" /><div class=\"inner\"><p class=\"name\">Anonymous</p><p class=\"score\"><img src=\"img/redflag.png\" /> <span class=\"value\">0</span></p></div></div>");

            canvas = $("#board canvas").get(0);
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
            $("#board").css({ opacity : 1.0 }).show();
            $("#game").stop().fadeIn("slow", function () {
                $("#game").css({ opacity : 1.0 });
            });
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
