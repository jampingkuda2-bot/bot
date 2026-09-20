'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Eye, ZoomIn, ZoomOut, ChevronsUpDown, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { PAGE_SIZES } from '../lib/constants';
import DocBody from './DocBody';

const PADDING_TOP = 16;
const PAGE_NUMBER_RESERVE_MM = 8;

export default function PreviewPanel({ doc, update, pageW, pageH, zoom, setZoom, previewRef }) {
  const page = PAGE_SIZES[doc.pageSize];
  const isL = doc.orientation === 'landscape';
  const mmW = isL ? page.mmH : page.mmW;
  const mmH = isL ? page.mmW : page.mmH;
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef(null);
  const margin = doc.showCover ? 0 : doc.margin;

  // Sama persis dengan logika export PDF
  const reservePx = useMemo(
    () => (doc.showPageNumbers ? (pageH * PAGE_NUMBER_RESERVE_MM) / mmH : 0),
    [pageH, mmH, doc.showPageNumbers]
  );
  const usablePageH = useMemo(() => Math.max(100, pageH - reservePx), [pageH, reservePx]);

  // Pagination + hitung halaman
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;

    const applyPagination = () => {
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

      // Hitung jumlah halaman — persis seperti export:
      // contentMm = imgH - reserve
      // pages = ceil(contentMm / usableH)
      requestAnimationFrame(() => {
        const h = el.scrollHeight;
        const contentPx = Math.max(1, h - reservePx);
        const count = Math.max(1, Math.ceil(contentPx / usablePageH));
        setPages(count);
      });
    };

    const t = setTimeout(applyPagination, 80);
    return () => clearTimeout(t);
  }, [doc, usablePageH, reservePx, previewRef, zoom]);

  useEffect(() => {
    if (currentPage > pages) setCurrentPage(pages);
  }, [pages, currentPage]);

  // Update current page saat scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const top = el.scrollTop - PADDING_TOP;
      const p = Math.floor(top / (usablePageH * zoom)) + 1;
      setCurrentPage(Math.max(1, Math.min(pages, p)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [usablePageH, zoom, pages]);

  const scrollToPage = (n) => {
    const target = Math.max(1, Math.min(pages, n));
    setCurrentPage(target);
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({
        top: PADDING_TOP + (target - 1) * usablePageH * zoom,
        behavior: 'smooth',
      });
    }
  };

  // Swipe gesture
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let startX = 0, startY = 0, active = false;
    const onStart = (e) => {
      if (e.pointerType !== 'touch') return;
      if (e.target.closest && (e.target.closest('[data-draggable]') || e.target.closest('[data-toolbar]'))) return;
      active = true;
      startX = e.clientX;
      startY = e.clientY;
    };
    const onEnd = (e) => {
      if (!active) return;
      active = false;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) scrollToPage(currentPage + 1);
        else scrollToPage(currentPage - 1);
      }
    };
    el.addEventListener('pointerdown', onStart);
    el.addEventListener('pointerup', onEnd);
    return () => {
      el.removeEventListener('pointerdown', onStart);
      el.removeEventListener('pointerup', onEnd);
    };
  }, [currentPage, pages, usablePageH, zoom]);

  return (
    <div className="flex flex-col min-h-0 bg-neutral-100 dark:bg-neutral-950">
      {/* Toolbar */}
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
            onClick={() => scrollToPage(currentPage - 1)}
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
            onClick={() => scrollToPage(currentPage + 1)}
            disabled={currentPage >= pages}
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Halaman berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(Math.max(0.4, +(zoom - 0.1).toFixed(2)))}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs w-10 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(1.6, +(zoom + 0.1).toFixed(2)))}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(0.75)}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
            title="Fit"
          >
            <ChevronsUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div
          style={{
            width: pageW * zoom,
            margin: '0 auto',
            paddingTop: PADDING_TOP,
            paddingBottom: PADDING_TOP,
            position: 'relative',
          }}
        >
          <PageBreakOverlay usablePageH={usablePageH} zoom={zoom} pages={pages} />
          <div
            ref={previewRef}
            className="shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]"
            style={{
              width: pageW,
              minHeight: pageH,
              boxSizing: 'border-box',
              padding: margin,
              background: '#ffffff',
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              fontFamily: doc.fontFamily,
              fontSize: doc.fontSize,
              lineHeight: doc.lineHeight,
              color: '#111827',
              position: 'relative',
            }}
          >
            <Watermark text={doc.watermark} />
            <DocBody doc={doc} update={update} zoom={zoom} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PageBreakOverlay({ usablePageH, zoom, pages }) {
  if (pages <= 1) return null;
  return (
    <>
      {Array.from({ length: pages - 1 }).map((_, i) => {
        const top = (i + 1) * usablePageH * zoom + PADDING_TOP;
        return (
          <div
            key={i}
            className="absolute left-0 right-0 pointer-events-none z-20"
            style={{ top }}
          >
            <div className="border-t-2 border-dashed border-red-400/80" />
            <div className="absolute right-2 -top-2.5 text-[10px] font-medium text-white bg-red-500 px-2 py-0.5 rounded shadow">
              Hal. {i + 2}
            </div>
          </div>
        );
      })}
    </>
  );
}

function Watermark({ text }) {
  if (!text) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 grid place-items-center"
      style={{ zIndex: 0 }}
    >
      <div
        style={{
          transform: 'rotate(-30deg)',
          fontSize: 120,
          fontWeight: 800,
          color: '#000',
          opacity: 0.05,
          whiteSpace: 'nowrap',
          letterSpacing: 8,
        }}
      >
        {text}
      </div>
    </div>
  );
}
