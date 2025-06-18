import React, { useState, useRef } from 'react';

export default function Canvas({
  elements = [],
  onAdd,
  onMove,
  onRemove,
  tool = 'select',
  className = ''
}) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [pathPoints, setPathPoints] = useState([]); 
  const svgRef = useRef(null);

  const toNorm = e => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * 100) / rect.width,
      y: ((e.clientY - rect.top) * 100) / rect.height
    };
  };

  const handleMouseDown = e => {
    if (tool === 'pencil') {
      const start = toNorm(e);
      setDragging(true);
      setPathPoints([start]);
    }
    else if (['circle','triangle','square'].includes(tool)) {
      const start = toNorm(e);
      setDragging(true);
      setPreview({ type: tool, x0: start.x, y0: start.y, x1: start.x, y1: start.y });
    }
  };

  const handleMouseMove = e => {
    if (!dragging) return;
    const pos = toNorm(e);
    if (tool === 'pencil') {
      setPathPoints(prev => [...prev, pos]);
    }
    else if (preview) {
      setPreview(prev => prev && ({ ...prev, x1: pos.x, y1: pos.y }));
    }
  };

  const handleMouseUp = () => {
    if (dragging) {
      if (tool === 'pencil' && pathPoints.length > 1) {
        onAdd({ id: Date.now().toString(), type: 'pencil', points: pathPoints });
        setPathPoints([]);
      }
      else if (preview) {
        onAdd({ id: Date.now().toString(), ...preview });
        setPreview(null);
      }
    }
    setDragging(false);
  };

  const renderShape = el => {
    const strokeW = 0.3;
    switch (el.type) {
      case 'square': {
        const w = el.x1 - el.x0, h = el.y1 - el.y0;
        const size = Math.min(Math.abs(w), Math.abs(h)) * (w < 0 ? -1 : 1);
        return (
          <rect key={el.id}
            x={el.x0} y={el.y0}
            width={size} height={size}
            fill="rgba(96,165,250,0.5)"
            stroke="#1e3a8a" strokeWidth={strokeW}
          />
        );
      }
      case 'circle': {
        const w = el.x1 - el.x0, h = el.y1 - el.y0;
        const r = Math.hypot(w, h) / 2;
        return (
          <circle key={el.id}
            cx={(el.x0 + el.x1) / 2} cy={(el.y0 + el.y1) / 2}
            r={r}
            fill="rgba(96,165,250,0.5)"
            stroke="#1e3a8a" strokeWidth={strokeW}
          />
        );
      }
      case 'triangle': {
        return (
          <polygon key={el.id}
            points={`${el.x0},${el.y1} ${(el.x0+el.x1)/2},${el.y0} ${el.x1},${el.y1}`}
            fill="rgba(96,165,250,0.5)"
            stroke="#1e3a8a" strokeWidth={strokeW}
          />
        );
      }
      case 'pencil': {
        const pts = el.points.map(p => `${p.x},${p.y}`).join(' ');
        return (
          <polyline key={el.id}
            points={pts}
            fill="none"
            stroke="#1e3a8a"
            strokeWidth={strokeW}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      }
      default:
        return null;
    }
  };

  return (
    <svg
      ref={svgRef}
      className={className}
      width="100%" height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ background: '#f3f4f6' }}
    >
      {/* Grid de fondo */}
      <defs>
        <pattern id="smallGrid" width="1" height="1" patternUnits="userSpaceOnUse">
          <path d="M1 0 L0 0 0 1" fill="none" stroke="#e5e7eb" strokeWidth="0.1" />
        </pattern>
        <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill="url(#smallGrid)" />
          <path d="M5 0 L0 0 0 5" fill="none" stroke="#d1d5db" strokeWidth="0.2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Shapes existentes */}
      {elements.map(el => renderShape(el))}

      {/* Preview de shapes */}
      {preview && renderShape({ id:'preview', ...preview })}

      {/* Preview de lápiz */}
      {tool === 'pencil' && pathPoints.length > 1 && (
        <polyline
          points={pathPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#1e3a8a"
          strokeWidth={0.3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
