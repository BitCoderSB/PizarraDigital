import { Server } from 'socket.io';

let io;

export function initRealtime(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', socket => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // Unirse a una sala de pizarra
    socket.on('joinBoard', boardId => {
      socket.join(boardId);
      console.log(`${socket.id} se unió a la sala ${boardId}`);
      socket.emit('joinedBoard', boardId);
    });

    // Añadir elemento
    socket.on('board:add', ({ boardId, element }) => {
      socket.to(boardId).emit('board:add', element);
    });

    // Actualizar elemento
    socket.on('board:update', ({ boardId, elementId, x, y }) => {
      io.to(boardId).emit('board:update', { elementId, x, y });
    });

    // Eliminar elemento
    socket.on('board:remove', ({ boardId, elementId }) => {
      io.to(boardId).emit('board:remove', elementId);
    });

    // **Chat**: recibir y difundir mensajes
    socket.on('chat:message', ({ boardId, user, text }) => {
      const msg = { user, text, timestamp: Date.now() };
      socket.to(boardId).emit('chat:message', msg);
    });

    // Desconexión
    socket.on('disconnect', () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Realtime no inicializado');
  return io;
}
