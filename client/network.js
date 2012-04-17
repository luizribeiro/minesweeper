var Network = function () {
    var socket;
    
    function Network() {
    }

    Network.prototype.connect = function () {
        var host = window.location.hostname || "localhost";
        socket = io.connect("http://" + host + ":5050", { "connect timeout": 5000 });

        socket.on("connect", function (data) {
            Controller.notify("network_connected");
        });

        socket.on("error", function (data) {
            Controller.notify("network_error", data);
        });

        socket.on("opponent", function (data) {
            Model.init();
        });

        socket.on("turn", function (data) {
            Model.setMyTurn(true);
        });

        socket.on("wait", function (data) {
            Model.setMyTurn(false);
        });

        socket.on("state", function (data) {
            Model.updateMap(data);
            Resources.getSound("sndshoot").play();
        });

        socket.on("chicken", function (data) {
            Controller.notify("game_chicken");
        });

        socket.on("win", function (data) {
            Controller.notify("game_win");
        });

        socket.on("lose", function (data) {
            Controller.notify("game_lose");
        });

        socket.on("draw", function (data) {
            Controller.notify("game_draw");
        });

        socket.on("cursor", function (data) {
            Model.setOpCursor(data);
        });
    };

    Network.prototype.shoot = function (cursor) {
        socket.emit("shoot", cursor);
    };

    Network.prototype.challenge = function (cursor) {
        socket.emit("challenge", []);
    };

    return new Network();
}();
