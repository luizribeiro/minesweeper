(function() {
	var canvas, context;
	var socket;

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
			renderMessage("Your opponent is " + data);
		});
	}

	function renderMessage(msg) {
		context.fillStyle = "#000";
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.fillStyle = "#fff";
		context.font = "bold 12px sans-serif";
		context.textAlign = "center";
		context.fillText(msg, canvas.width/2, canvas.height/2);
	}

	function ev_mousedown(ev) {
	}

	main();
})();
