import { useState, useEffect } from 'react';
import { socket } from '../services/socket';


export function useBoard(boardId) {
  const [elements, setElements] = useState([]);

  useEffect(() => {
    // 1) Conectar y unirse a la sala
    socket.connect();
    socket.emit('joinBoard', boardId);

    // 2) Inicializar con snapshot si el servidor lo envía
    socket.on('board:init', initial => {
      setElements(initial);
    });

    // 3) Escuchar añadidos
    socket.on('board:add', element => {
      setElements(prev => [...prev, element]);
    });

    // 4) Escuchar actualizaciones
    socket.on('board:update', update => {
      setElements(prev =>
        prev.map(el => (el.id === update.id ? { ...el, ...update } : el))
      );
    });

    // 5) Escuchar eliminaciones
    socket.on('board:remove', elementId => {
      setElements(prev => prev.filter(el => el.id !== elementId));
    });

    return () => {
      socket.off('board:init');
      socket.off('board:add');
      socket.off('board:update');
      socket.off('board:remove');
      socket.disconnect();
    };
  }, [boardId]);

  
  function addElement(element) {
    setElements(prev => [...prev, element]);
    socket.emit('board:add', { boardId, element });
  }

  
  function updateElement({ id, x0, y0, x1, y1, ...rest }) {
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, x0, y0, x1, y1, ...rest } : el))
    );
    socket.emit('board:update', { boardId, elementId: id, x0, y0, x1, y1, ...rest });
  }

  
  function removeElement(id) {
    setElements(prev => prev.filter(el => el.id !== id));
    socket.emit('board:remove', { boardId, elementId: id });
  }

  return { elements, addElement, updateElement, removeElement };
}