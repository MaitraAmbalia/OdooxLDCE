import { Server } from 'socket.io';

let io = null;

export function initSocket(server, config = {}, logger = console) {
  io = new Server(server, {
    cors: {
      origin: config.corsOrigin || ['http://localhost:5173', 'http://localhost:5174'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.info?.({ socketId: socket.id }, 'WebSocket client connected');

    socket.on('join:event', (eventId) => {
      if (eventId) {
        socket.join(`event:${eventId}`);
      }
    });

    socket.on('leave:event', (eventId) => {
      if (eventId) {
        socket.leave(`event:${eventId}`);
      }
    });

    socket.on('join:task', (taskId) => {
      if (taskId) {
        socket.join(`task:${taskId}`);
      }
    });

    socket.on('leave:task', (taskId) => {
      if (taskId) {
        socket.leave(`task:${taskId}`);
      }
    });

    socket.on('join:claims', () => {
      socket.join('claims:queue');
    });

    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info?.({ socketId: socket.id }, 'WebSocket client disconnected');
    });
  });

  return io;
}

export function getIO() {
  return io;
}
