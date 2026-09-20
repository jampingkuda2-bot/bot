'use client';

import { useRef, useCallback } from 'react';

export default function DragTarget({
  id,
  doc,
  update,
  zoom = 1,
  children,
  style = {},
  className = '',
  selected = false,
  onSelect,
}) {
  const draggingRef = useRef(false);
  const locked = !!doc.locked;

  const xKey = id + 'OffsetX';
  const yKey = id + 'OffsetY';
  const offsetX = doc[xKey] || 0;
  const offsetY = doc[yKey] || 0;

  const onPointerDown = useCallback((e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest && e.target.closest('[data-toolbar]')) return;

    if (onSelect) onSelect(id);
    if (locked) return;

    e.preventDefault();
    e.stopPropagation();

    draggingRef.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = doc[xKey] || 0;
    const origY = doc[yKey] || 0;
    const scale = zoom || 1;

    const move = (ev) => {
      if (!draggingRef.current) return;
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      update({
        [xKey]: Math.round(origX + dx),
        [yKey]: Math.round(origY + dy),
      });
    };

    const up = () => {
      draggingRef.current = false;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }, [doc, update, zoom, xKey, yKey, locked, onSelect, id]);

  return (
    <div
      data-draggable={id}
      onPointerDown={onPointerDown}
      className={`relative ${className}`}
      style={{
        cursor: locked ? 'default' : 'move',
        touchAction: locked ? 'auto' : 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        transform: `translate(${offsetX}px, ${offsetY}px)`,
        outline: selected && !locked ? '2px solid rgba(37,99,235,0.85)' : 'none',
        outlineOffset: 4,
        borderRadius: 4,
        minWidth: 40,
        minHeight: 20,
        ...style,
      }}
    >
      <div style={{ pointerEvents: 'none' }}>{children}</div>
    </div>
  );
}
