var Model = (function () {
    'use strict';
    /*global Controller, Resources */

    var map, myTurn,
        myScore, opScore,
        myCursor, opCursor;

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

    return new Model();
}());
