import type { Server as IOServer, Socket } from 'socket.io';

// Export a function to attach websocket handlers to an existing io instance
let ioInstance: IOServer | null = null;
export function setupWebSocketHandlers(io: IOServer) {
  ioInstance = io;
  io.on('connection', (_socket: Socket) => {
    console.log('WebSocket client connected');
    // Optionally, send initial data here
  });
}

export function emitDataUpdate(type: string, data: any) {
  if (ioInstance) ioInstance.emit(`${type}:update`, data);
}

export function emitUnitsUpdate(data: any) {
  if (ioInstance) ioInstance.emit('units:update', data);
}

export function registerDataType(_type: string) {
  // Optionally, add logic to track registered types for admin/debug
  // This is a placeholder for future extensibility
} 