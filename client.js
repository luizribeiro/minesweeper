window.onload = function() {
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

	var MAP_OFFSET_X = 12;
	var MAP_OFFSET_Y = 32;
	var COLORS = {
		1 : "#06266f",
		2 : "#078600",
		3 : "#a60400",
		4 : "#4c036e",
		5 : "#a63100",
		6 : "#04859d",
		7 : "#443425",
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

		canvas.addEventListener("mousemove", ev_mousemove, false);
		canvas.addEventListener("mousedown", ev_mousedown, false);
		canvas.onselectstart = function () { return false; };
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
			win : "img/win.png",
			lose : "img/lose.png",
			draw : "img/draw.png",
			boom : "snd/boom.ogg",
			sndlose : "snd/lose.ogg",
			sndwin : "snd/win.ogg",
			sndshoot : "snd/shoot.ogg",
		};

		renderMessage("Loading...");

		for(var src in sources)
			numResources++;

		resources = {};
		for(var src in sources) {
			if(sources[src].indexOf("img") === 0) {
				resources[src] = new Image();
				resources[src].onload = function () {
					if(++cntResources >= numResources)
						callback();
				};
				resources[src].src = sources[src];
			} else if(sources[src].indexOf("snd") === 0) {
				resources[src] = new Audio(sources[src]);
				cntResources++;
			}
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
				if(data[i].z === "A" || data[i].z === "B")
					resources.boom.play();
				if(data[i].z === "A") myScore++;
				else if(data[i].z === "B") opScore++;
				map[data[i].x][data[i].y] = data[i].z;
			}
			renderGame();
			resources.sndshoot.play();
		});

		socket.on("chicken", function (data) {
			turn = false;
			renderMessage("Your opponent chickened out, sorry.");
		});

		socket.on("win", function (data) {
			turn = false;
			clearScreen();
			context.drawImage(resources.win, canvas.width/2 - 64, canvas.height/2 - 104);
			context.fillStyle = "#443425";
			context.font = "bold 60px 'Oleo Script'";
			context.textAlign = "center";
			context.fillText("You Win!", canvas.width/2, canvas.height/2 + 86);
			resources.sndwin.play();
		});

		socket.on("lose", function (data) {
			turn = false;
			clearScreen();
			context.drawImage(resources.lose, canvas.width/2 - 64, canvas.height/2 - 104);
			context.fillStyle = "#443425";
			context.font = "bold 60px 'Oleo Script'";
			context.textAlign = "center";
			context.fillText("You Lose!", canvas.width/2, canvas.height/2 + 86);
			resources.sndlose.play();
		});

		socket.on("draw", function (data) {
			turn = false;
			clearScreen();
			context.drawImage(resources.draw, canvas.width/2 - 64, canvas.height/2 - 104);
			context.fillStyle = "#443425";
			context.font = "bold 60px 'Oleo Script'";
			context.textAlign = "center";
			context.fillText("Draw!", canvas.width/2, canvas.height/2 + 86);
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

	function renderScores() {
		context.drawImage(resources.blueflag, MAP_OFFSET_X+5, 10);
		context.fillStyle = "#443425";
		context.font = "bold 20px sans-serif";
		context.textAlign = "left";
		context.fillText(myScore, MAP_OFFSET_X+29, 26);

		context.drawImage(resources.redflag, MAP_OFFSET_X+16*24-23, 10);
		context.fillStyle = "#443425";
		context.font = "bold 20px sans-serif";
		context.textAlign = "right";
		context.fillText(opScore, MAP_OFFSET_X+16*24-29, 26);

		renderText(turn ? "It's your turn" : "Please wait...", canvas.width/2, 23);
	}

	function renderGame() {
		clearScreen();
		renderScores();
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
		context.fillStyle = "#443425";
		context.font = "bold 12px sans-serif";
		context.textAlign = "center";
		context.fillText(msg, x, y);
	}

	function renderMessage(msg) {
		clearScreen();
		renderText(msg, canvas.width/2, canvas.height/2);
	}

	function ev_mousemove(ev) {
		var coords = canvas.relMouseCoords(ev);

		if(!turn) return;

		coords.x = Math.floor((coords.x-MAP_OFFSET_X)/24);
		coords.y = Math.floor((coords.y-MAP_OFFSET_Y)/24);

		if(coords.x >= 0 && coords.x < 16 && coords.y >= 0 && coords.y < 16) {
			myCursor = coords;
			renderGame();
		}
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
			resources.sndshoot.play();
		}

		renderGame();
	}

	main();
};
