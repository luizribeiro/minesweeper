// Port in which the server will listen
exports.HTTP_PORT = 8888;

// Path to the application on the server (regex)
// (only change this if you're install behind a proxy like nginx)
exports.APP_PATH = /^\//;

// Allowed socket.io transports
exports.TRANSPORTS = ["websocket"];

// Initial number of mines on the board
exports.NUM_MINES = 40;

// Path to the client's resources
exports.RESOURCES_PATH = "../client";
