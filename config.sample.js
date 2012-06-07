// Set this to a secret value to encrypt session cookies
exports.SESSION_SECRET = "put something random here";

// Facebook App ID
exports.FACEBOOK_APP_ID = "put your facebook app id here";

// Facebook App Secret
exports.FACEBOOK_SECRET = "put your facebook app secret here";

// Put your HTTPS key/certificate file path here
exports.HTTPS_KEY = undefined;
exports.HTTPS_CRT = undefined;

// Port in which the server will listen
exports.HTTP_PORT = 8888;

// Allowed socket.io transports
exports.TRANSPORTS = ["websocket"];

// Initial number of mines on the board
exports.NUM_MINES = 40;

// Path to the client's resources
exports.RESOURCES_PATH = "./static";

// Path to the client's views
exports.VIEWS_PATH = "./views";
