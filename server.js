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
	var playerGame = {};
	var game = {};
	var availablePlayer = null;
	var gameCount = 0;

    io.sockets.on("connection", function (socket) {
		console.log("Player " + socket.id + " just connected.");
		onlinePlayers[socket.id] = socket;

		if(availablePlayer === null) {
			availablePlayer = socket.id;
		} else {
			setupGame(availablePlayer, socket.id);
			availablePlayer = null;
			announceTurn(playerGame[socket.id]);
		}

		socket.on("shoot", function (data) {
			var gid = playerGame[socket.id];
			game[gid].turn++;
			announceTurn(gid);

		});

        socket.on("disconnect", function (data) {
			console.log("Player " + socket.id + " disconnected.");
			if(availablePlayer === socket.id) {
				availablePlayer = null;
			}
			delete onlinePlayers[socket.id];
        });
    });

	function setupGame(player1, player2) {
		console.log(player1 + " vs " + player2);
		onlinePlayers[player1].emit("opponent", player2);
		onlinePlayers[player2].emit("opponent", player1);
		playerGame[player1] = gameCount;
		playerGame[player2] = gameCount;
		game[gameCount] = {
			turn : 0,
			map : [],
			player1 : player1,
			player2 : player2
		};
		gameCount++;
	}

	function announceTurn(gid) {
		if(game[gid].turn % 2 === 0) {
			onlinePlayers[game[gid].player1].emit("turn", []);
			onlinePlayers[game[gid].player2].emit("wait", []);
		} else {
			onlinePlayers[game[gid].player1].emit("wait", []);
			onlinePlayers[game[gid].player2].emit("turn", []);
		}
	}
 })();
