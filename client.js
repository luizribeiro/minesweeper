(function() {
	var canvas, context;
	var socket;
	var opponent;
	var map;

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
			setupMap();
			renderGame();
		});
	}

	function setupMap() {
		map = [];
		for(var i = 0; i < 16; i++) {
			map.push([]);
			for(var j = 0; j < 16; j++) {
				map[i].push(-1);
			}
		}
	}

	function renderGame() {
		clearScreen();
		renderText("Your opponent is " + opponent, canvas.width/2, canvas.height - 24);
		for(var i = 0; i < 16; i++) {
			for(var j = 0; j < 16; j++) {
				if(map[i][j] == -1) context.fillStyle = "#aaa";
				else context.fillStyle = "#000";
				context.fillRect(24*i, 24*j, 24, 24);
				context.strokeStyle = "#000";
				context.strokeRect(24*i, 24*j, 24, 24);
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

		if(ev.offsetX) {
			x = ev.offsetX;
			y = ev.offsetY;
		} else {
			x = ev.layerX;
			y = ev.layerY;
		}

		map[Math.floor(x/24)][Math.floor(y/24)] = 0;

		renderGame();
	}

	main();
})();
