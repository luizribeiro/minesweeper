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
			if(game[gid].bomb[data.x][data.y] === 0)
				game[gid].turn++;
			floodState(gid, data.x, data.y);
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

		// announce opponents
		onlinePlayers[player1].emit("opponent", player2);
		onlinePlayers[player2].emit("opponent", player1);

		// store game id information to each player
		playerGame[player1] = gameCount;
		playerGame[player2] = gameCount;

		// create game
		game[gameCount] = {
			turn : 0,
			map : [],
			bomb : [],
			revealed : [],
			player1 : player1,
			player2 : player2
		};

		// create map
		for(var i = 0; i < 16; i++) {
			game[gameCount].map.push([]);
			game[gameCount].bomb.push([]);
			game[gameCount].revealed.push([]);
			for(var j = 0; j < 16; j++) {
				game[gameCount].map[i].push(0);
				game[gameCount].bomb[i].push(0);
				game[gameCount].revealed[i].push(0);
			}
		}

		// place bombs
		for(var i = 0; i < 50; i++) {
			var x = Math.floor(Math.random()*16);
			var y = Math.floor(Math.random()*16);
			if(game[gameCount].bomb[x][y] === 1)
				i--;
			else {
				game[gameCount].bomb[x][y] = 1;
				for(var dx = -1; dx <= 1; dx++)
					for(var dy = -1; dy <= 1; dy++) {
						if(x+dx < 0 || x+dx >= 16 || y+dy < 0 || y+dy >= 16) continue;
						if(game[gameCount].bomb[x+dx][y+dy] === 0)
							game[gameCount].map[x+dx][y+dy]++;
					}
			}
		}

		gameCount++;
	}

	function floodState(gid, x, y) {
		game[gid].revealed[x][y] = 1;

		if(game[gid].bomb[x][y] === 1) {
			onlinePlayers[game[gid].player1].emit("state", { x : x, y : y, z : game[gid].turn % 2 == 0 ? "A" : "B" });
			onlinePlayers[game[gid].player2].emit("state", { x : x, y : y, z : game[gid].turn % 2 == 0 ? "B" : "A" });
			return;
		}

		onlinePlayers[game[gid].player1].emit("state", { x : x, y : y, z : game[gid].map[x][y] });
		onlinePlayers[game[gid].player2].emit("state", { x : x, y : y, z : game[gid].map[x][y] });

		if(game[gid].map[x][y] === 0)
			for(var dx = -1; dx <= 1; dx++)
				for(var dy = -1; dy <= 1; dy++)
					if(x+dx >= 0 && x+dx < 16 && y+dy >= 0 && y+dy < 16 && dx*dy === 0 && game[gid].revealed[x+dx][y+dy] === 0)
						floodState(gid, x+dx, y+dy);
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
