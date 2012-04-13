(function() {
	var canvas, context;
	var socket;
	var opponent;
	var map;
	var turn;

	var MAP_OFFSET_X = 128;
	var MAP_OFFSET_Y = 32;

	function main() {
		setupCanvas();
		setupSocket();
	}

	function setupCanvas() {
		canvas = document.getElementById("canvas");
		context = canvas.getContext("2d");

		canvas.addEventListener("mousedown", ev_mousedown, false);
	}

	function setupSocket() {
		renderMessage("Connecting to game server...");

		socket = io.connect("http://localhost:5050", { "connect timeout": 5 });

		socket.on("connect_failed", function (data) {
			renderMessage("Connection failed.");
		});

		socket.on("connect", function (data) {
			renderMessage("Waiting for opponents...");
		});

		socket.on("opponent", function (data) {
			opponent = data;
			turn = false;
			setupMap();
			renderGame();
		});

		socket.on("turn", function (data) {
			turn = true;
			renderGame();
		});

		socket.on("wait", function (data) {
			turn = false;
			renderGame();
		});

		socket.on("state", function (data) {
			map[data.x][data.y] = data.z;
			console.log(data);
			renderGame();
		});
	}

	function setupMap() {
		map = [];
		for(var i = 0; i < 16; i++) {
			map.push([]);
			for(var j = 0; j < 16; j++) {
				map[i].push(-3);
			}
		}
	}

	function renderGame() {
		clearScreen();
		renderText("Your opponent is " + opponent, canvas.width/2, canvas.height - 24);
		renderText(turn ? "It's your turn" : "Please wait...", canvas.width/2, canvas.height - 12);
		for(var i = 0; i < 16; i++) {
			for(var j = 0; j < 16; j++) {
				if(map[i][j] == -3) context.fillStyle = "#aaa";
				else context.fillStyle = "#555";
				context.fillRect(MAP_OFFSET_X+24*i, MAP_OFFSET_Y+24*j, 24, 24);
				context.strokeStyle = "#000";
				context.strokeRect(MAP_OFFSET_X+24*i, MAP_OFFSET_Y+24*j, 24, 24);
				if(map[i][j] === 1) context.fillStyle = "#00a";
				else if(map[i][j] === 2) context.fillStyle = "#a00";
				else if(map[i][j] === 3) context.fillStyle = "#0a0";
				else if(map[i][j] === 4) context.fillStyle = "#0aa";
				else if(map[i][j] === 5) context.fillStyle = "#aa0";
				else if(map[i][j] === "A") context.fillStyle = "#00a";
				else if(map[i][j] === "B") context.fillStyle = "#a00";
				if(map[i][j] > 0 || map[i][j] === "A" || map[i][j] === "B") {
					context.font = "bold 20px sans-serif";
					context.textAlign = "center";
					context.fillText(map[i][j], MAP_OFFSET_X+24*i+12, MAP_OFFSET_Y+24*j+19);
				}
			}
		}
	}

	function clearScreen() {
		context.fillStyle = "#000";
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.fillStyle = "#fff";
	}

	function renderText(msg, x, y) {
		context.font = "bold 12px sans-serif";
		context.textAlign = "center";
		context.fillText(msg, x, y);
	}

	function renderMessage(msg) {
		clearScreen();
		renderText(msg, canvas.width/2, canvas.height/2);
	}

	function ev_mousedown(ev) {
		var x, y;

		if(!turn) return;

		if(ev.offsetX) {
			x = ev.offsetX;
			y = ev.offsetY;
		} else {
			x = ev.layerX;
			y = ev.layerY;
		}

		x = Math.floor((x-MAP_OFFSET_X)/24);
		y = Math.floor((y-MAP_OFFSET_Y)/24);

		if(x >= 0 && x < 16 && y >= 0 && y < 16) {
			if(map[x][y] >= 0) return;
			map[x][y] = 0;
			turn = false;
			socket.emit("shoot", { x : x, y : y });
		}

		renderGame();
	}

	main();
})();
