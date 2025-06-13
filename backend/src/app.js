// backend/src/app.js
import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { initRealtime } from './modules/realtime/index.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Resto de middlewares, rutas REST, etc.
// app.use('/api/…', …);

initRealtime(server);  // arranca Socket.IO sobre nuestro server HTTP

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Backend en puerto ${PORT}`);
});
