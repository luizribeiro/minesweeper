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
            numResources++;
        }

        for (src in RESOURCES) {
            if (RESOURCES[src].indexOf("img") === 0) {
                this.images[src] = new Image();
                this.images[src].onload = resource_callback;
                this.images[src].src = RESOURCES[src];
            } else if (RESOURCES[src].indexOf("snd") === 0) {
                this.sounds[src] = new Audio(RESOURCES[src]);
                cntResources++;
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
