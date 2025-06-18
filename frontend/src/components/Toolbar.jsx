import React from 'react';

export default function Toolbar({ onToolSelect, onToggleChat }) {
  return (
    <div className="toolbar">
      <button onClick={() => onToolSelect('select')} title="Seleccionar">🖐️</button>
      <button onClick={() => onToolSelect('text')} title="Texto">🅰️</button>
      <button onClick={() => onToolSelect('square')} title="Cuadrado">◻️</button>
      <button onClick={() => onToolSelect('circle')} title="Círculo">⚪</button>
      <button onClick={() => onToolSelect('triangle')} title="Triángulo">△</button>
      <button onClick={() => onToolSelect('pencil')} title="Lápiz">🖊️</button>

      <div style={{ flexGrow: 1 }} />

      <button onClick={() => onToolSelect('zoomIn')} title="Zoom In">
        🔍+
      </button>
      <button onClick={() => onToolSelect('zoomOut')} title="Zoom Out">
        🔍–
      </button>

      <button onClick={onToggleChat} title="Abrir chat">
        💬
      </button>
    </div>
  );
}