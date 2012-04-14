(function() {
    var io = require("socket.io").listen(5050);

	io.set("transports", ["websocket"]);
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

	var NUM_BOMBS = 50;

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
			if(data.x < 0 || data.x >= 16 || data.y < 0 || data.y >= 16
				|| game[gid].revealed[data.x][data.y] === 1) // invalid shoot
				return;
			// prevent cheating on other player's turn
			if(socket.id === game[gid].player1 && game[gid].turn % 2 == 1) return;
			if(socket.id === game[gid].player2 && game[gid].turn % 2 == 0) return;
			if(game[gid].bomb[data.x][data.y] === 0)
				game[gid].turn++;

			var stateDelta1 = [], stateDelta2 = [];
			var floodState = function (gid, x, y) {
				game[gid].revealed[x][y] = 1;

				if(game[gid].bomb[x][y] === 1) {
					stateDelta1.push({ x : x, y : y, z : game[gid].turn % 2 == 0 ? "A" : "B" });
					stateDelta2.push({ x : x, y : y, z : game[gid].turn % 2 == 0 ? "B" : "A" });
					if(game[gid].turn % 2 == 0) game[gid].score1++;
					else game[gid].score2++;
					game[gid].bombsLeft--;
					return;
				}

				stateDelta1.push({ x : x, y : y, z : game[gid].map[x][y] });
				stateDelta2.push({ x : x, y : y, z : game[gid].map[x][y] });

				if(game[gid].map[x][y] === 0)
					for(var dx = -1; dx <= 1; dx++)
						for(var dy = -1; dy <= 1; dy++)
							if(x+dx >= 0 && x+dx < 16 && y+dy >= 0 && y+dy < 16 && game[gid].revealed[x+dx][y+dy] === 0)
								floodState(gid, x+dx, y+dy);
			}

			floodState(gid, data.x, data.y);
			onlinePlayers[game[gid].player1].emit("state", stateDelta1);
			onlinePlayers[game[gid].player2].emit("state", stateDelta2);

			announceTurn(gid);
		});

        socket.on("disconnect", function (data) {
			console.log("Player " + socket.id + " disconnected.");
			if(availablePlayer === socket.id) {
				availablePlayer = null;
			} else if(socket.id in playerGame) {
				var gid = playerGame[socket.id];
				var opponent = socket.id === game[gid].player1 ? game[gid].player2 : game[gid].player1;
				onlinePlayers[opponent].emit("chicken", []);
				destroyGame(gid);
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
			bombsLeft : NUM_BOMBS,
			revealed : [],
			player1 : player1,
			score1 : 0,
			player2 : player2,
			score2 : 0
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
		for(var i = 0; i < NUM_BOMBS; i++) {
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

	function destroyGame(gid) {
		delete playerGame[game[gid].player1];
		delete playerGame[game[gid].player2];
		delete game[gid];
		delete game[gid];
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
