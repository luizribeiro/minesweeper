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

var Resources = (function () {
    'use strict';
    /*global Audio, Controller, Image */

    var RESOURCES = {
        // images
        button : "img/button.png",
        tile : "img/tile.png",
        redflag : "img/redflag.png",
        blueflag : "img/blueflag.png",
        redcursor : "img/redcursor.png",
        bluecursor : "img/bluecursor.png",
        win : "img/win.png",
        lose : "img/lose.png",
        draw : "img/draw.png",
        anonymous : "img/anonymous.png",

        // sound effects
        boom : "snd/boom.ogg",
        sndlose : "snd/lose.ogg",
        sndwin : "snd/win.ogg",
        sndshoot : "snd/shoot.ogg",
    };

    function Resources() {
        this.images = {};
        this.sounds = {};
    }

    Resources.prototype.load = function () {
        var numResources = 0, cntResources = 0,
            src, resource_callback;

        resource_callback = function () {
            if (++cntResources >= numResources) {
                Controller.notify("resources_loaded");
            }
        };

        for (src in RESOURCES) {
            if (RESOURCES.hasOwnProperty(src)) {
                numResources++;
            }
        }

        for (src in RESOURCES) {
            if (RESOURCES.hasOwnProperty(src)) {
                if (RESOURCES[src].indexOf("img") === 0) {
                    this.images[src] = new Image();
                    this.images[src].onload = resource_callback;
                    this.images[src].src = RESOURCES[src];
                } else if (RESOURCES[src].indexOf("snd") === 0) {
                    this.sounds[src] = new Audio(RESOURCES[src]);
                    cntResources++;
                }
            }
        }

        return this;
    };

    Resources.prototype.getImage = function (img) {
        return this.images[img];
    };

    Resources.prototype.getSound = function (snd) {
        return this.sounds[snd];
    };

    return new Resources();
}());
