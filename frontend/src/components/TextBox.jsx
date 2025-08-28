import React, { useRef, useEffect } from 'react';


const RESIZE_HANDLES = {
  TL: 'nw-resize', // Top-Left
  TR: 'ne-resize', // Top-Right
  BL: 'sw-resize', // Bottom-Left
  BR: 'se-resize', // Bottom-Right
  T: 'n-resize',   // Top
  B: 's-resize',   // Bottom
  L: 'w-resize',   // Left
  R: 'e-resize',   // Right
};

export default function TextBox({ data, onChange, tool, onSelect }) {
  const { id, x, y, width, height, text, placeholder, color, focus, fontSize } = data;
  const textBoxRef = useRef(null);


  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(null);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const initialBoxXRef = useRef(0);
  const initialBoxYRef = useRef(0);
  const initialBoxWidthRef = useRef(0);
  const initialBoxHeightRef = useRef(0);

  const adjustSize = () => {
    const el = textBoxRef.current;
    if (!el) return { w: width, h: height, text: text ?? '' };

    const originalOverflow = el.style.overflow;
    const originalWidthStyle = el.style.width;
    const originalHeightStyle = el.style.height;


    el.style.overflow = 'visible';
    el.style.width = 'auto';
    el.style.height = 'auto';

    const measuredText = el.innerText;
    const newWidth = el.offsetWidth;
    const newHeight = el.offsetHeight;

  
    el.style.overflow = originalOverflow;
    el.style.width = originalWidthStyle;
    el.style.height = originalHeightStyle;

    return { w: newWidth, h: newHeight, text: measuredText };
  };


  useEffect(() => {
    const el = textBoxRef.current;
    if (!el) return;

    if (focus) {
      el.focus();
      try {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        console.warn("[TextBox.jsx] Error al mover el cursor al final:", e);
      }
    }

    requestAnimationFrame(() => {
      const { w, h, text: t } = adjustSize();
      onChange({ width: w, height: h, text: t, fontSize });
    });
  }, [focus]);


  useEffect(() => {
    const el = textBoxRef.current;
    if (!el) return;
    if (el.innerText !== (text ?? '')) {
      el.innerText = text ?? '';
      requestAnimationFrame(() => {
        const { w, h, text: t } = adjustSize();
        onChange({ width: w, height: h, text: t, fontSize });
      });
    }
  }, [text]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const { w, h, text: t } = adjustSize();
      onChange({ width: w, height: h, text: t, fontSize });
    });
  }, [fontSize]);

  const handlePointerDown = (e) => {
    if (tool === 'select' && (e.button === 0 || e.pointerType === 'touch')) {
      if (typeof onSelect === 'function') onSelect(id);

      e.stopPropagation();
      try { e.target.setPointerCapture(e.pointerId); } catch {}

      dragStartXRef.current = e.clientX;
      dragStartYRef.current = e.clientY;
      initialBoxXRef.current = x;
      initialBoxYRef.current = y;
      initialBoxWidthRef.current = width;
      initialBoxHeightRef.current = height;

      const handleType = e.target.dataset.handle;
      if (handleType) {
        isResizingRef.current = handleType;
      } else {
        isDraggingRef.current = true;
        if (textBoxRef.current) textBoxRef.current.style.cursor = 'grabbing';
      }
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current && !isResizingRef.current) return;

    const dx = e.clientX - dragStartXRef.current;
    const dy = e.clientY - dragStartYRef.current;

    let newX = initialBoxXRef.current;
    let newY = initialBoxYRef.current;
    let newWidth = initialBoxWidthRef.current;
    let newHeight = initialBoxHeightRef.current;

    if (isDraggingRef.current) {
      newX = initialBoxXRef.current + dx;
      newY = initialBoxYRef.current + dy;
    } else if (isResizingRef.current) {
      const handleType = isResizingRef.current;

      const isCornerHandle = ['TL', 'TR', 'BL', 'BR'].includes(handleType);
      if (isCornerHandle) {
        const currentWidthChange = initialBoxWidthRef.current + dx;
        const currentHeightChange = initialBoxHeightRef.current + dy;

        let scale = 1;
        if (initialBoxWidthRef.current && initialBoxHeightRef.current) {
          const scaleX = currentWidthChange / initialBoxWidthRef.current;
          const scaleY = currentHeightChange / initialBoxHeightRef.current;
          scale = Math.max(scaleX, scaleY);
        } else {
          scale = Math.max(Math.abs(dx) / 50, Math.abs(dy) / 30);
        }

        newWidth = initialBoxWidthRef.current * scale;
        newHeight = initialBoxHeightRef.current * scale;

        if (handleType === 'TL') {
          newX = initialBoxXRef.current + (initialBoxWidthRef.current - newWidth);
          newY = initialBoxYRef.current + (initialBoxHeightRef.current - newHeight);
        } else if (handleType === 'BL') {
          newX = initialBoxXRef.current + (initialBoxWidthRef.current - newWidth);
        } else if (handleType === 'TR') {
          newY = initialBoxYRef.current + (initialBoxHeightRef.current - newHeight);
        }
      } else {
        switch (handleType) {
          case 'T':
            newHeight = initialBoxHeightRef.current - dy;
            newY = initialBoxYRef.current + dy;
            break;
          case 'B':
            newHeight = initialBoxHeightRef.current + dy;
            break;
          case 'L':
            newWidth = initialBoxWidthRef.current - dx;
            newX = initialBoxXRef.current + dx;
            break;
          case 'R':
            newWidth = initialBoxWidthRef.current + dx;
            break;
          default:
            break;
        }
      }

      newWidth = Math.max(50, newWidth);
      newHeight = Math.max(30, newHeight);
    }

    onChange({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
      text: (textBoxRef.current?.innerText ?? ''),
      fontSize
    });
  };

  const handlePointerUp = (e) => {
    if (isDraggingRef.current || isResizingRef.current) {
      isDraggingRef.current = false;
      isResizingRef.current = null;
      try { e.target.releasePointerCapture(e.pointerId); } catch {}
      requestAnimationFrame(() => {
        const { w, h, text: t } = adjustSize();
        onChange({ width: w, height: h, text: t, fontSize });
      });
    }
  };

  
  const handleInput = () => {
    requestAnimationFrame(() => {
      const { w, h, text: t } = adjustSize();
      onChange({ width: w, height: h, text: t, fontSize });
    });
  };

  const handleBlur = () => {
    requestAnimationFrame(() => {
      const { w, h, text: t } = adjustSize();
      onChange({ width: w, height: h, text: t, focus: false, fontSize });
    });
  };

  
  const baseStyle = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    color: color || '#111827',
    fontSize: `${fontSize}px`,

    
    display: 'inline-block', 
    whiteSpace: 'pre',
    lineHeight: '1.2',
    overflow: 'visible'
  };

  const pointerEventsStyle = {
    pointerEvents: (tool === 'text' || tool === 'select') ? 'auto' : 'none',
  };

  const finalStyle = { ...baseStyle, ...pointerEventsStyle };

  if (tool === 'select') {
    finalStyle.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
  } else {
    finalStyle.cursor = 'text';
  }

  return (
    <div
      id={id}
      ref={textBoxRef}
      className="text-box"
      style={finalStyle}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder || ''}
      onInput={handleInput}
      onBlur={handleBlur}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {tool === 'select' && (
        <>
          {Object.keys(RESIZE_HANDLES).map(handleType => (
            <div
              key={handleType}
              className={`resize-handle ${handleType}`}
              data-handle={handleType}
              contentEditable={false}         
              style={{ cursor: RESIZE_HANDLES[handleType] }}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ))}
        </>
      )}
    </div>
  );
}
