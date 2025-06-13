import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BoardView from './pages/BoardView';

const root = createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      {/* Ruta dinámica para cada pizarra */}
      <Route path="/boards/:boardId" element={<BoardView />} />
      {/* Puedes añadir más rutas (login, dashboard…) */}
    </Routes>
  </BrowserRouter>
);
