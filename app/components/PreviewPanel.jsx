'use client';

import { useState, useEffect } from 'react';
import { Eye, ZoomIn, ZoomOut, ChevronsUpDown } from 'lucide-react';
import { PAGE_SIZES } from '../lib/constants';
import DocBody from './DocBody';

export default function PreviewPanel({ doc, pageW, pageH, zoom, setZoom, previewRef }) {
  const page = PAGE_SIZES[doc.pageSize];
  const isL = doc.orientation === 'landscape';
  const mmW = isL ? page.mmH : page.mmW;
  const mmH = isL ? page.mmW : page.mmH;
  const [pages, setPages] = useState(1);

  useEffect(() => {
    if (!previewRef.current) return;
    const el = previewRef.current;
    const update = () => setPages(Math.max(1, Math.ceil(el.scrollHeight / pageH)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [previewRef, pageH, doc]);

  return (
    <div className="flex flex-col min-h-0 bg-neutral-100 dark:bg-neutral-950">
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            Preview
          </span>
          <span className="hidden sm:inline">{mmW}×{mmH} mm</span>
          <span>·</span>
          <span>{pages} halaman</span>
        </div>
        <div className="flex items-center gap-1">
          <ZoomBtn onClick={() => setZoom(Math.max(0.4, +(zoom - 0.1).toFixed(2)))}>
            <ZoomOut className="w-4 h-4" />
          </ZoomBtn>
          <span className="text-xs w-12 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <ZoomBtn onClick={() => setZoom(Math.min(1.6, +(zoom + 0.1).toFixed(2)))}>
            <ZoomIn className="w-4 h-4" />
          </ZoomBtn>
          <ZoomBtn onClick={() => setZoom(0.75)}>
            <ChevronsUpDown className="w-4 h-4" />
          </ZoomBtn>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 lg:p-10">
        <div style={{ width: pageW * zoom, margin: '0 auto', position: 'relative' }}>
          <PageBreakOverlay pageH={pageH} zoom={zoom} totalHeight={pageH * pages} />
          <div
            ref={previewRef}
            className="shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]"
            style={{
              width: pageW,
              minHeight: pageH,
              background: '#ffffff',
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              fontFamily: doc.fontFamily,
              fontSize: doc.fontSize,
              lineHeight: doc.lineHeight,
              color: '#111827',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Watermark text={doc.watermark} />
            <DocBody doc={doc} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ZoomBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg transition hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
    >
      {children}
    </button>
  );
}

function PageBreakOverlay({ pageH, zoom, totalHeight }) {
  const count = Math.ceil(totalHeight / pageH);
  if (count <= 1) return null;
  return (
    <>
      {Array.from({ length: count - 1 }).map((_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 pointer-events-none z-10"
          style={{ top: (i + 1) * pageH * zoom }}
        >
          <div className="border-t border-dashed border-blue-400/60" />
          <div className="absolute right-0 -top-2.5 text-[10px] font-medium text-blue-500 bg-white px-1.5 rounded">
            Hal. {i + 2}
          </div>
        </div>
      ))}
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
      <div style={{
        transform: 'rotate(-30deg)',
        fontSize: 120,
        fontWeight: 800,
        color: '#000',
        opacity: 0.05,
        whiteSpace: 'nowrap',
        letterSpacing: 8,
      }}>
        {text}
      </div>
    </div>
  );
}
