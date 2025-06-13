// frontend/src/services/socket.js
import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Crear y exportar una sola instancia
export const socket = io(URL, {
  autoConnect: false,   // conectamos manualmente cuando estemos listos
  transports: ['websocket']
});
