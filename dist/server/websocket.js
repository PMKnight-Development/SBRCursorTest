"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = setupWebSocket;
const socket_io_1 = require("socket.io");
function setupWebSocket(server) {
    const io = new socket_io_1.Server(server);
    io.on('connection', (_socket) => {
        console.log('WebSocket client connected');
    });
}
//# sourceMappingURL=websocket.js.map