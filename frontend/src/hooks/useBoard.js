import { useState, useEffect, useCallback } from 'react';
import { socket } from '../services/socket';

export function useBoard(boardId) {
  const [elements, setElements] = useState([]);

  useEffect(() => {
    socket.connect();
    socket.emit('joinBoard', boardId);

    socket.on('board:add', el => {
      setElements(prev => [...prev, el]);
    });
    socket.on('board:update', ({ elementId, x, y }) => {
      setElements(prev =>
        prev.map(el => (el.id === elementId ? { ...el, x, y } : el))
      );
    });
    socket.on('board:remove', id => {
      setElements(prev => prev.filter(el => el.id !== id));
    });

    return () => {
      socket.off('board:add');
      socket.off('board:update');
      socket.off('board:remove');
      socket.disconnect();
    };
  }, [boardId]);

  const addElement = useCallback(el => {
    setElements(prev => [...prev, el]);
    socket.emit('board:add', { boardId, element: el });
  }, [boardId]);

  const updateElement = useCallback(({ id, x, y }) => {
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, x, y } : el))
    );
    socket.emit('board:update', { boardId, elementId: id, x, y });
  }, [boardId]);

  const removeElement = useCallback(id => {
    setElements(prev => prev.filter(el => el.id !== id));
    socket.emit('board:remove', { boardId, elementId: id });
  }, [boardId]);

  return { elements, addElement, updateElement, removeElement };
}
