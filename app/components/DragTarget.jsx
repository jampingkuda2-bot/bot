'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  RotateCcw, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Trash2,
} from 'lucide-react';

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
  onDelete,
  deleteTitle,
  nudgeStep = 4,
}) {
  const [hovered, setHovered] = useState(false);
  const [tapped, setTapped] = useState(false);
  const draggingRef = useRef(false);
  const wrapperRef = useRef(null);
  const locked = !!doc.locked;

  const xKey = id + 'OffsetX';
  const yKey = id + 'OffsetY';
  const offsetX = doc[xKey] || 0;
  const offsetY = doc[yKey] || 0;

  // Hide toolbar saat tap di luar elemen
  useEffect(() => {
    if (!tapped) return;
    const onDown = (e) => {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(e.target)) return;
      setTapped(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [tapped]);

  const onPointerDown = useCallback((e) => {
    if (locked) return;
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest && e.target.closest('[data-toolbar]')) return;

    // Tampilkan toolbar saat tap/klik (kunci untuk HP)
    setTapped(true);

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
  }, [doc, update, zoom, xKey, yKey, locked]);

  const nudge = (dx, dy) => update({
    [xKey]: offsetX + dx,
    [yKey]: offsetY + dy,
  });

  const resetPos = () => update({ [xKey]: 0, [yKey]: 0 });

  const currentAlign = alignKey ? doc[alignKey] : null;
  const showToolbar = (hovered || tapped) && !locked;
  const active = hovered || tapped;

  const btn = 'p-1.5 hover:bg-white/15 rounded transition';

  return (
    <div
      ref={wrapperRef}
      data-draggable={id}
      onPointerDown={onPointerDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative ${className}`}
      style={{
        cursor: locked ? 'default' : 'move',
        touchAction: locked ? 'auto' : 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transform: `translate(${offsetX}px, ${offsetY}px)`,
        outline: active && !locked ? '1px dashed rgba(37,99,235,0.5)' : 'none',
        outlineOffset: 4,
        borderRadius: 4,
        minWidth: 40,
        minHeight: 20,
        ...style,
      }}
    >
      {showToolbar && (
        <div
          data-toolbar
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onMouseEnter={() => setHovered(true)}
          style={{
            position: 'absolute',
            top: `${-42 / zoom}px`,
            left: '50%',
            transform: `translateX(-50%) scale(${1 / zoom})`,
            transformOrigin: 'bottom center',
            zIndex: 50,
            whiteSpace: 'nowrap',
          }}
          className="flex items-center gap-0.5 bg-neutral-900 dark:bg-neutral-700 text-white rounded-lg px-1.5 py-1 shadow-2xl"
        >
          <button onClick={() => nudge(-nudgeStep, 0)} className={btn} title="Geser kiri">
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button onClick={() => nudge(nudgeStep, 0)} className={btn} title="Geser kanan">
            <ChevronRight className="w-3 h-3" />
          </button>
          <button onClick={() => nudge(0, -nudgeStep)} className={btn} title="Geser atas">
            <ChevronUp className="w-3 h-3" />
          </button>
          <button onClick={() => nudge(0, nudgeStep)} className={btn} title="Geser bawah">
            <ChevronDown className="w-3 h-3" />
          </button>

          {alignKey && alignOptions?.length > 0 && (
            <>
              <span className="w-px h-3 bg-white/25 mx-0.5" />
              {alignOptions.map((opt) => {
                const Icon = opt.icon;
                const isActive = currentAlign === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => update({ [alignKey]: opt.value })}
                    className={`p-1.5 rounded transition ${
                      isActive ? 'bg-white/25' : 'hover:bg-white/15'
                    }`}
                    title={opt.title}
                  >
                    <Icon className="w-3 h-3" />
                  </button>
                );
              })}
            </>
          )}

          <span className="w-px h-3 bg-white/25 mx-0.5" />
          <button onClick={resetPos} className={btn} title="Reset posisi">
            <RotateCcw className="w-3 h-3" />
          </button>

          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-500/40 rounded transition"
              title={deleteTitle || 'Hapus konten'}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
