'use client';

import { useRef, useState, useCallback } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DragTarget({
  id,
  doc,
  update,
  zoom = 1,
  children,
  style = {},
  className = '',
  alignKey,
  alignOptions,
  nudgeStep = 4,
}) {
  const [hovered, setHovered] = useState(false);
  const draggingRef = useRef(false);
  const locked = !!doc.locked;

  const xKey = id + 'OffsetX';
  const yKey = id + 'OffsetY';
  const offsetX = doc[xKey] || 0;
  const offsetY = doc[yKey] || 0;

  const onPointerDown = useCallback((e) => {
    if (locked) return;
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest && e.target.closest('[data-toolbar]')) return;

    e.preventDefault();
    e.stopPropagation();

    draggingRef.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = doc[xKey] || 0;
    const origY = doc[yKey] || 0;
    const scale = zoom || 1;
    document.body.style.userSelect = 'none';

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
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }, [doc, update, zoom, xKey, yKey, locked]);

  const nudge = (dx) => update({ [xKey]: offsetX + dx });

  const resetPos = () => update({ [xKey]: 0, [yKey]: 0 });

  const currentAlign = alignKey ? doc[alignKey] : null;
  const showToolbar = hovered && !locked;

  return (
    <div
      onPointerDown={onPointerDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative ${className}`}
      style={{
        cursor: locked ? 'default' : 'move',
        touchAction: locked ? 'auto' : 'none',
        transform: `translate(${offsetX}px, ${offsetY}px)`,
        ...style,
      }}
    >
      {showToolbar && (
        <div
          data-toolbar
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: -40,
            left: '50%',
            transform: `translateX(-50%) scale(${1 / (zoom || 1)})`,
            transformOrigin: 'bottom center',
            zIndex: 50,
          }}
          className="flex items-center gap-0.5 bg-neutral-900 dark:bg-neutral-700 text-white rounded-lg px-1 py-0.5 shadow-xl text-[10px] whitespace-nowrap"
        >
          <button
            onClick={() => nudge(-nudgeStep)}
            className="p-1.5 hover:bg-white/15 rounded transition"
            title={`Geser kiri ${nudgeStep}px`}
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => nudge(nudgeStep)}
            className="p-1.5 hover:bg-white/15 rounded transition"
            title={`Geser kanan ${nudgeStep}px`}
          >
            <ChevronRight className="w-3 h-3" />
          </button>

          {alignKey && alignOptions?.length > 0 && (
            <>
              <span className="w-px h-3 bg-white/25 mx-0.5" />
              {alignOptions.map((opt) => {
                const Icon = opt.icon;
                const active = currentAlign === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => update({ [alignKey]: opt.value })}
                    className={`p-1.5 rounded transition ${active ? 'bg-white/25' : 'hover:bg-white/15'}`}
                    title={opt.title}
                  >
                    <Icon className="w-3 h-3" />
                  </button>
                );
              })}
            </>
          )}

          <span className="w-px h-3 bg-white/25 mx-0.5" />
          <button
            onClick={resetPos}
            className="p-1.5 hover:bg-white/15 rounded transition"
            title="Reset posisi"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
