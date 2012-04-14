(function() {
	var canvas, context;
	var resources;
	var socket;
	var opponent;
	var map;
	var turn;
	var myScore;
	var opScore;
	var myCursor;
	var opCursor;

	var MAP_OFFSET_X = 128;
	var MAP_OFFSET_Y = 32;
	var COLORS = {
		1 : "#06266f",
		2 : "#078600",
		3 : "#a60400",
		4 : "#4c036e",
		5 : "#a63100",
		6 : "#04859d",
		7 : "#000000",
		8 : "#333333"
	};

	/* Utils {{{ */
	function relMouseCoords(event){
		var totalOffsetX = 0;
		var totalOffsetY = 0;
		var canvasX = 0;
		var canvasY = 0;
		var currentElement = this;

		do{
			totalOffsetX += currentElement.offsetLeft;
			totalOffsetY += currentElement.offsetTop;
		} while(currentElement = currentElement.offsetParent)

		canvasX = event.pageX - totalOffsetX;
		canvasY = event.pageY - totalOffsetY;

		return { x : canvasX, y : canvasY }
	}
	HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;
	/* }}} */

	function main() {
		setupCanvas();
		loadResources(function () {
			setupSocket();
		});
	}

	function setupCanvas() {
		canvas = document.getElementById("canvas");
		context = canvas.getContext("2d");

		canvas.addEventListener("mousedown", ev_mousedown, false);
	}

	function loadResources(callback) {
		var numResources = 0;
		var cntResources = 0;
		var sources = {
			button : "img/button.png",
			tile : "img/tile.png",
			redflag : "img/redflag.png",
			blueflag : "img/blueflag.png",
			redcursor : "img/redcursor.png",
			bluecursor : "img/bluecursor.png",
		};

		renderMessage("Loading...");

		for(var src in sources)
			numResources++;

		resources = {};
		for(var src in sources) {
			resources[src] = new Image();
			resources[src].onload = function () {
				if(++cntResources >= numResources)
					callback();
			};
			resources[src].src = sources[src];
		}
	}

	function setupSocket() {
		renderMessage("Connecting to game server...");

		socket = io.connect("http://" + (window.location.hostname || "localhost") + ":5050",
				{ "connect timeout": 5 });

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
			for(var i = 0; i < data.length; i++) {
				if(data[i].z === "A") myScore++;
				else if(data[i].z === "B") opScore++;
				map[data[i].x][data[i].y] = data[i].z;
			}
			renderGame();
		});

		socket.on("chicken", function (data) {
			turn = false;
			renderMessage("Your opponent chickened out, sorry.");
		});

		socket.on("cursor", function (data) {
			opCursor = data;
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

		myScore = 0;
		opScore = 0;
	}

	function renderGame() {
		clearScreen();
		renderText(myScore + " x " + opScore, canvas.width/2, 20);
		renderText("Your opponent is " + opponent, canvas.width/2, canvas.height - 24);
		renderText(turn ? "It's your turn" : "Please wait...", canvas.width/2, canvas.height - 12);
		for(var i = 0; i < 16; i++) {
			for(var j = 0; j < 16; j++) {
				if(map[i][j] == -3) context.drawImage(resources.button, MAP_OFFSET_X+24*i, MAP_OFFSET_Y+24*j);
				else {
					context.drawImage(resources.tile, MAP_OFFSET_X+24*i, MAP_OFFSET_Y+24*j);
					if(map[i][j] > 0 || map[i][j] === "A" || map[i][j] === "B") {
						if(map[i][j] >= 1 && map[i][j] <= 8) {
							context.fillStyle = COLORS[map[i][j]];
							context.font = "bold 18px sans-serif";
							context.textAlign = "center";
							context.fillText(map[i][j], MAP_OFFSET_X+24*i+12, MAP_OFFSET_Y+24*j+18);
						} else if(map[i][j] === "A") {
							context.drawImage(resources.blueflag, MAP_OFFSET_X+24*i+3, MAP_OFFSET_Y+24*j+2);
						} else if(map[i][j] === "B") {
							context.drawImage(resources.redflag, MAP_OFFSET_X+24*i+3, MAP_OFFSET_Y+24*j+2);
						}
					}
				}
			}
		}
		if(myCursor)
			context.drawImage(resources.bluecursor, MAP_OFFSET_X+24*myCursor.x, MAP_OFFSET_Y+24*myCursor.y);
		if(opCursor)
			context.drawImage(resources.redcursor, MAP_OFFSET_X+24*opCursor.x, MAP_OFFSET_Y+24*opCursor.y);
	}

	function clearScreen() {
		context.clearRect(0, 0, canvas.width, canvas.height);
	}

	function renderText(msg, x, y) {
		context.fillStyle = "#000";
		context.font = "bold 12px sans-serif";
		context.textAlign = "center";
		context.fillText(msg, x, y);
	}

	function renderMessage(msg) {
		clearScreen();
		renderText(msg, canvas.width/2, canvas.height/2);
	}

	function ev_mousedown(ev) {
		var coords = canvas.relMouseCoords(ev);
		var x = coords.x, y = coords.y;

		if(!turn) return;

		x = Math.floor((x-MAP_OFFSET_X)/24);
		y = Math.floor((y-MAP_OFFSET_Y)/24);

		if(x >= 0 && x < 16 && y >= 0 && y < 16) {
			if(map[x][y] !== -3) return;
			map[x][y] = 0;
			turn = false;
			myCursor = { x : x, y : y };
			socket.emit("shoot", myCursor);
		}

		renderGame();
	}

	main();
})();
