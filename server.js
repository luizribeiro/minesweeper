(function() {
    var io = require("socket.io").listen(5050);
    io.set("log level", 1);

	/* Utils {{{ */
	Object.size = function(obj) {
		var size = 0, key;
		for(key in obj)
			if(obj.hasOwnProperty(key)) size++;
		return size;
	};
	/* }}} */

	var onlinePlayers = {};
	var opponent = {};
	var availablePlayer = null;

    io.sockets.on("connection", function (socket) {
		console.log("Player " + socket.id + " just connected.");
		onlinePlayers[socket.id] = socket;

		if(availablePlayer === null) {
			availablePlayer = socket.id;
		} else {
			console.log(socket.id + " vs " + availablePlayer);
			onlinePlayers[availablePlayer].emit("opponent", socket.id);
			socket.emit("opponent", availablePlayer);
			opponent[availablePlayer] = socket.id;
			opponent[socket.id] = availablePlayer;
			availablePlayer = null;
		}

        socket.on("disconnect", function (data) {
			console.log("Player " + socket.id + " disconnected.");
			if(availablePlayer === socket.id) {
				availablePlayer = null;
			}
			delete onlinePlayers[socket.id];
        });
    });
 })();
