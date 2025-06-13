import React from 'react';
import { useParams } from 'react-router-dom';
import Canvas from '../components/Canvas';
import { useBoard } from '../hooks/useBoard';

export default function BoardView() {
  const { boardId } = useParams();
  // Aquí ya vienen los elementos y las funciones de añadir, mover y borrar
  const { elements, addElement, updateElement, removeElement } = useBoard(boardId);

  // Encapsula la creación de un nuevo elemento
  const handleAdd = (x, y) => {
    addElement({ id: Date.now().toString(), x, y, text: 'Nuevo' });
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Tablero {boardId}</h1>
      <Canvas
        elements={elements}
        onAdd={handleAdd}
        onMove={(id, x, y) => updateElement({ id, x, y })}
        onRemove={id => removeElement(id)}
      />
    </div>
  );
}
