'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Eye, ZoomIn, ZoomOut, ChevronsUpDown, ChevronLeft, ChevronRight,
  Lock, Unlock,
} from 'lucide-react';
import { PAGE_SIZES } from '../lib/constants';
import DocBody from './DocBody';
import ElementToolbar from './ElementToolbar';

const PAGE_NUMBER_RESERVE_MM = 8;

export default function PreviewPanel({
  doc, update, pageW, pageH, zoom, setZoom, previewRef, focusLast = 0,
}) {
  const page = PAGE_SIZES[doc.pageSize];
  const isL = doc.orientation === 'landscape';
  const mmW = isL ? page.mmH : page.mmW;
  const mmH = isL ? page.mmW : page.mmH;
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const swipeRef = useRef(null);
  const margin = doc.showCover ? 0 : doc.margin;
  const locked = !!doc.locked;

  const reservePx = useMemo(
    () => (doc.showPageNumbers ? (pageH * PAGE_NUMBER_RESERVE_MM) / mmH : 0),
    [pageH, mmH, doc.showPageNumbers]
  );
  const usablePageH = useMemo(() => Math.max(100, pageH - reservePx), [pageH, reservePx]);

  useEffect(() => {
    if (locked && selected) setSelected(null);
  }, [locked, selected]);

  useEffect(() => {
    if (!selected) return;
    if (selected === 'logo' && !doc.logo) setSelected(null);
    if (selected === 'title' && !(doc.title?.trim() || doc.subtitle?.trim())) setSelected(null);
    if (selected === 'author' && !(doc.author?.trim() || doc.date?.trim())) setSelected(null);
    if (selected.startsWith('sec_')) {
      const id = selected.slice(4);
      const sec = doc.sections.find((s) => s.id === id);
      if (!sec || !(sec.heading?.trim() || sec.body?.trim())) setSelected(null);
    }
  }, [doc, selected]);

  // Auto-scroll ke halaman terakhir setelah Tambah Bagian
  const lastFocusHandledRef = useRef(0);
  useEffect(() => {
    if (!focusLast || focusLast === lastFocusHandledRef.current) return;
    const t = setTimeout(() => {
      lastFocusHandledRef.current = focusLast;
      setCurrentPage(pages);
    }, 300);
    return () => clearTimeout(t);
  }, [focusLast, pages]);

  // Pagination
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;

    const apply = () => {
      el.querySelectorAll('[data-spacer]').forEach((s) => s.remove());

      const scale = zoom || 1;
      const elTop = el.getBoundingClientRect().top;
      const blocks = Array.from(el.querySelectorAll('[data-block]'));

      blocks.forEach((block) => {
        const rect = block.getBoundingClientRect();
        const top = (rect.top - elTop) / scale;
        const height = rect.height / scale;
        const pageStart = Math.floor(top / usablePageH) * usablePageH;
        const pageEnd = pageStart + usablePageH;
        const manualBreak = block.dataset.pageBreak === 'true';
        const crosses = top + height > pageEnd - 4;
        const fitsOnOnePage = height + 32 <= usablePageH;

        let pushDown = 0;
        if (manualBreak && top > pageStart + 2) pushDown = pageEnd - top;
        else if (crosses && fitsOnOnePage) pushDown = pageEnd - top;

        if (pushDown > 2 && pushDown < usablePageH) {
          const spacer = document.createElement('div');
          spacer.setAttribute('data-spacer', '1');
          spacer.style.height = pushDown + 'px';
          spacer.style.pointerEvents = 'none';
          block.parentNode.insertBefore(spacer, block);
        }
      });

      requestAnimationFrame(() => {
        const h = el.scrollHeight;
        const contentPx = Math.max(1, h - reservePx);
        const count = Math.max(1, Math.ceil(contentPx / usablePageH));
        setPages(count);
        setCurrentPage((cp) => Math.min(cp, count));
      });
    };

    const t = setTimeout(apply, 80);
    return () => clearTimeout(t);
  }, [doc, usablePageH, reservePx, previewRef, zoom]);

  const goTo = (n) => setCurrentPage(Math.max(1, Math.min(pages, n)));

  useEffect(() => {
    const el = swipeRef.current;
    if (!el) return;
    let x0 = 0, y0 = 0, active = false;
    const down = (e) => {
      if (e.pointerType !== 'touch') return;
      if (e.target.closest && (e.target.closest('[data-draggable]') || e.target.closest('[data-toolbar]'))) return;
      active = true; x0 = e.clientX; y0 = e.clientY;
    };
    const up = (e) => {
      if (!active) return;
      active = false;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) goTo(currentPage + 1);
        else goTo(currentPage - 1);
      }
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointerup', up);
    };
  }, [currentPage, pages]);

  const offsetY = (currentPage - 1) * usablePageH;

  return (
    <div className="flex flex-col min-h-0 bg-neutral-100 dark:bg-neutral-950">
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </span>
          <span className="hidden md:inline">· {mmW}×{mmH} mm</span>
        </div>

        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Halaman sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs tabular-nums px-2 font-medium min-w-[56px] text-center">
            {currentPage} / {pages}
          </span>
          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= pages}
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Halaman berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => update({ locked: !locked })}
            className={`p-2 rounded-lg transition ${
              locked
                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
            }`}
            title={locked ? 'Terkunci — klik untuk buka' : 'Kunci judul, logo & penulis'}
          >
            {locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
          <span className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-0.5" />
          <button onClick={() => setZoom(Math.max(0.4, +(zoom - 0.1).toFixed(2)))} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300" title="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.min(1.6, +(zoom + 0.1).toFixed(2)))} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300" title="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setZoom(0.75)} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300" title="Fit">
            <ChevronsUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ElementToolbar
        selected={locked ? null : selected}
        doc={doc}
        update={update}
        onClose={() => setSelected(null)}
      />

      {locked && (
        <div className="border-b border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 text-[11px] text-amber-700 dark:text-amber-300">
          🔒 Posisi judul, logo & penulis terkunci. Klik ikon kunci di toolbar untuk membuka.
        </div>
      )}

      <div ref={swipeRef} className="flex-1 overflow-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div
            className="shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] rounded-sm"
            style={{
              width: pageW * zoom,
              height: pageH * zoom,
              overflow: 'hidden',
              position: 'relative',
              background: '#ffffff',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute', top: 0, left: 0, width: pageW,
                transform: `scale(${zoom}) translateY(${-offsetY}px)`,
                transformOrigin: 'top left',
                transition: 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1)',
                willChange: 'transform',
              }}
            >
              <div
                ref={previewRef}
                style={{
                  width: pageW,
                  minHeight: pageH,
                  boxSizing: 'border-box',
                  padding: margin,
                  background: '#ffffff',
                  fontFamily: doc.fontFamily,
                  fontSize: doc.fontSize,
                  lineHeight: doc.lineHeight,
                  color: '#111827',
                  position: 'relative',
                }}
              >
                <Watermark text={doc.watermark} />
                <DocBody
                  doc={doc}
                  update={update}
                  zoom={zoom}
                  selected={selected}
                  onSelect={setSelected}
                />
              </div>
            </div>

            {doc.showPageNumbers && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-1.5 text-[9px] text-neutral-400 select-none pointer-events-none">
                {currentPage} / {pages}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Watermark({ text }) {
  if (!text) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center" style={{ zIndex: 0 }}>
      <div style={{
        transform: 'rotate(-30deg)', fontSize: 120, fontWeight: 800,
        color: '#000', opacity: 0.05, whiteSpace: 'nowrap', letterSpacing: 8,
      }}>{text}</div>
    </div>
  );
}
