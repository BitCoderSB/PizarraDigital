import React from 'react';

/**
 * Canvas: renderiza un SVG y pinta los elementos,
 * además de capturar clicks para añadir, mover y borrar.
 */
export default function Canvas({ elements = [], onAdd, onMove, onRemove }) {
  // Cuando el usuario hace click en el lienzo
  const handleClick = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onAdd(x, y);
  };

  return (
    <svg
      width="100%"
      height="500"
      onClick={handleClick}
      style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
    >
      {elements.map(el => (
        <g
          key={el.id}
          style={{ cursor: 'pointer' }}

          onClick={e => {
            e.stopPropagation();
            // Solo en click sencillo (detail === 1), no en doble click
            if (e.detail === 1) {
              onMove(el.id, el.x + 20, el.y + 20);
            }
          }}
          
          onDoubleClick={e => {
            e.stopPropagation();
            onRemove(el.id);
          }}
        >
          <circle
            cx={el.x}
            cy={el.y}
            r={20}
            fill="#93c5fd"
            stroke="#2563eb"
            strokeWidth={2}
          />
          <text
            x={el.x}
            y={el.y + 5}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="12"
            fontWeight="bold"
          >
            {el.text}
          </text>
        </g>
      ))}
    </svg>
  );
}
