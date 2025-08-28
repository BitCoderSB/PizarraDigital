import { useState, useEffect, useCallback, useRef } from 'react';
import { socket } from '../services/socket';

export function useBoard(boardId) {
  const [elements, setElements]   = useState([]);
  const [textBoxes, setTextBoxes] = useState([]);

  const [selectedId, setSelectedId] = useState(null);

  const API   = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  const token = localStorage.getItem('token') || '';
  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };

  const debounceTimeoutRef = useRef(null);

  const sendPersistRequest = useCallback((elementsToPersist) => {
    fetch(`${API}/boards/${boardId}/elements`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ elements: elementsToPersist })
    }).catch(err => console.error('useBoard PUT (Error en persistencia):', err));
  }, [API, boardId, authHeaders]);

  const persist = useCallback(newElements => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      sendPersistRequest(newElements);
    }, 500);
  }, [sendPersistRequest]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetch(`${API}/boards/${boardId}`, {
      method: 'GET',
      headers: authHeaders
    })
      .then(async res => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Error cargando pizarra (${res.status}): ${errorText}`);
        }
        return res.json();
      })
      .then(board => {
        setElements(board.elements || []);
      })
      .catch(err => {
        console.error('useBoard GET (Error en fetch):', err);
      });
  }, [API, boardId, token]);

  useEffect(() => {
    socket.auth = { token };
    socket.connect();
    socket.emit('joinBoard', boardId);

    socket.on('board:init', initial => {
      setElements(initial);
    });

    socket.on('board:add', el => {
      setElements(prev => {
        if (prev.some(existingEl => existingEl.id === el.id)) {
          return prev.map(e => (e.id === el.id ? el : e));
        }
        return [...prev, el];
      });
    });

    socket.on('board:update', upd => {
      setElements(prev => {
        const { elementId, id: _ignore, ...rest } = upd || {};
        if (!elementId) return prev;
        if (!prev.some(existingEl => existingEl.id === elementId)) {
          return prev;
        }
        return prev.map(e => (e.id === elementId ? { ...e, ...rest } : e));
      });
    });

    socket.on('board:remove', id => {
      setElements(prev => prev.filter(e => e.id !== id));
      setSelectedId(curr => (curr === id ? null : curr));
    });

    return () => {
      socket.off('board:init');
      socket.off('board:add');
      socket.off('board:update');
      socket.off('board:remove');
      socket.disconnect();
    };
  }, [boardId, token]);

  const addElement = useCallback(el => {
    setElements(prev => {
      if (prev.some(existingEl => existingEl.id === el.id)) {
        const next = prev.map(e => (e.id === el.id ? el : e));
        persist(next);
        return next;
      }
      const next = [...prev, el];
      persist(next);
      return next;
    });
    socket.emit('board:add', { boardId, element: el });
  }, [boardId, persist]);

  const updateElement = useCallback(update => {
    setElements(prev => {
      const next = prev.map(e =>
        e.id === update.id ? { ...e, ...update } : e
      );
      persist(next);
      return next;
    });

    const { id, ...changes } = update;
    socket.emit('board:update', {
      boardId,
      elementId: id,
      ...changes
    });
  }, [boardId, persist]);

  const removeElement = useCallback(id => {
    setElements(prev => {
      const next = prev.filter(e => e.id !== id);
      persist(next);
      return next;
    });
    socket.emit('board:remove', { boardId, elementId: id });
  }, [boardId, persist]);

  const selectElement = useCallback((id) => {
    setSelectedId(id);
  }, []);

  const setSelectedFontSize = useCallback((newSize) => {
    setElements(prev => {
      const el = prev.find(e => e.id === selectedId);
      if (!el) return prev;
      if (el.type !== 'text') return prev;

      const patched = prev.map(e =>
        e.id === selectedId ? { ...e, fontSize: newSize } : e
      );
      persist(patched);
      return patched;
    });

    if (selectedId) {
      updateElement({ id: selectedId, fontSize: newSize, updatedAt: Date.now() });
    }
  }, [selectedId, updateElement, persist]);

  const selectedElement = elements.find(e => e.id === selectedId) || null;

  const addTextBox = useCallback(box => {
    setTextBoxes(prev => [...prev, box]);
  }, []);

  const updateTextBox = useCallback((id, props) => {
    setTextBoxes(prev =>
      prev.map(tb => (tb.id === id ? { ...tb, ...props } : tb))
    );
  }, []);

  return {
    elements,
    textBoxes,
    selectedId,                 
    selectedElement,  
    selectElement, 
    setSelectedFontSize,
    addElement,
    updateElement,
    removeElement,
    addTextBox,
    updateTextBox
  };
}
