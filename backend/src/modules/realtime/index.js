import { Server } from 'socket.io';

let io;

export function initRealtime(server) {
  io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', socket => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // Unirse a la sala dinámica
    socket.on('joinBoard', boardId => {
      socket.join(boardId);
      console.log(`${socket.id} se unió a la sala ${boardId}`);
      // Confirmación opcional
      socket.emit('joinedBoard', boardId);
    });

    // Manejar evento real de añadir elemento
    socket.on('board:add', ({ boardId, element }) => {
      console.log(`↗ board:add en ${boardId}:`, element);
      // Reenviar a todos los miembros de la sala menos al emisor
      socket.to(boardId).emit('board:add', element);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`);
    });

    // 1.1 Actualizar posición de un elemento
    socket.on('board:update', ({ boardId, elementId, x, y }) => {
      io.to(boardId).emit('board:update', { elementId, x, y });
    });

    // 1.2 Eliminar un elemento
    socket.on('board:remove', ({ boardId, elementId }) => {
      io.to(boardId).emit('board:remove', elementId);
    });


  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Realtime no inicializado');
  return io;
}