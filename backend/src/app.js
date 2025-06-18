import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { initRealtime } from './modules/realtime/index.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

initRealtime(server);  

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Backend en puerto ${PORT}`);
});
