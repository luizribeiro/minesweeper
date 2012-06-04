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

var Model = (function () {
    'use strict';
    /*global Controller, Resources */

    var map, myTurn,
        myScore, opScore,
        myCursor, opCursor,
        myInfo, opInfo;

    function Model() {
    }

    Model.prototype.init = function () {
        var i, j;

        map = [];
        for (i = 0; i < 16; i++) {
            map.push([]);
            for (j = 0; j < 16; j++) {
                map[i].push(-3);
            }
        }

        myTurn = false;

        myScore = 0;
        opScore = 0;

        myCursor = undefined;
        opCursor = undefined;

        opInfo = undefined;

        Controller.notify("model_init");
    };

    Model.prototype.updateMap = function (data) {
        var i;

        for (i = 0; i < data.length; i++) {
            if (data[i].z === "A" || data[i].z === "B") {
                Resources.getSound("boom").play();
            }

            if (data[i].z === "A") {
                myScore++;
            } else if (data[i].z === "B") {
                opScore++;
            }

            map[data[i].x][data[i].y] = data[i].z;
        }

        Controller.notify("model_updated");

        return this;
    };

    Model.prototype.setMapCell = function (x, y, val) {
        map[x][y] = val;
        return this;
    };

    Model.prototype.getMapCell = function (x, y) {
        return map[x][y];
    };

    Model.prototype.setMyTurn = function (isMyTurn) {
        myTurn = isMyTurn;
        Controller.notify("model_updated");
        return this;
    };

    Model.prototype.isMyTurn = function () {
        return myTurn;
    };

    Model.prototype.getMyScore = function () {
        return myScore;
    };

    Model.prototype.getOpScore = function () {
        return opScore;
    };

    Model.prototype.setMyCursor = function (cursor) {
        myCursor = cursor;
        Controller.notify("model_updated");
        return this;
    };

    Model.prototype.getMyCursor = function () {
        return myCursor;
    };

    Model.prototype.setOpCursor = function (cursor) {
        opCursor = cursor;
        Controller.notify("model_updated");
        return this;
    };

    Model.prototype.getOpCursor = function () {
        return opCursor;
    };

    Model.prototype.setMyInfo = function (info) {
        myInfo = info;
        Controller.notify("model_updated");
        return this;
    };

    Model.prototype.getMyInfo = function () {
        return myInfo;
    };

    Model.prototype.setOpInfo = function (info) {
        opInfo = info;
        Controller.notify("model_updated");
        return this;
    };

    Model.prototype.getOpInfo = function () {
        return opInfo;
    };

    return new Model();
}());
