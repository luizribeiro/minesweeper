var Utils = (function () {
    'use strict';
    /*global HTMLCanvasElement */

    HTMLCanvasElement.prototype.relMouseCoords = function (event) {
        var totalOffsetX = 0, totalOffsetY = 0,
            canvasX = 0, canvasY = 0,
            currentElement = this;

        do {
            totalOffsetX += currentElement.offsetLeft;
            totalOffsetY += currentElement.offsetTop;
            currentElement = currentElement.offsetParent;
        } while (currentElement);

        canvasX = event.pageX - totalOffsetX;
        canvasY = event.pageY - totalOffsetY;

        return { x : canvasX, y : canvasY };
    };
}());
