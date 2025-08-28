import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';


import BoardView from './pages/BoardView';
import HomePage from './pages/HomePage';

import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/boards/:boardId" element={<BoardView />} />
        
      </Routes>
    </BrowserRouter>
);