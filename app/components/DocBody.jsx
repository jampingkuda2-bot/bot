'use client';

import { useRef, useCallback } from 'react';
import { PAGE_SIZES } from '../lib/constants';

export default function DocBody({ doc, update, zoom = 1 }) {
  const isPlain = !!doc.plain;
  const d = isPlain
    ? { ...doc, accent: '#111827', headingStyle: 'plain' }
    : doc;
  const p = d.margin;

  if (d.showCover) {
    return (
      <>
        <CoverPage doc={d} plain={isPlain} update={update} zoom={zoom} />
        <div style={{ padding: p, position: 'relative' }}>
          <ContentSections doc={d} plain={isPlain} />
        </div>
      </>
    );
  }

  return <ContentSections doc={d} plain={isPlain} update={update} zoom={zoom} />;
}

function useDrag(key, doc, update, zoom) {
  const draggingRef = useRef(false);
  const locked = !!doc.locked;

  return useCallback((e) => {
    if (locked) return;
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    draggingRef.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const xKey = key + 'OffsetX';
    const yKey = key + 'OffsetY';
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
  }, [doc, update, zoom, key, locked]);
}

function draggableStyle(offsets, locked) {
  return {
    cursor: locked ? 'default' : 'move',
    touchAction: locked ? 'auto' : 'none',
    transform: `translate(${offsets.x || 0}px, ${offsets.y || 0}px)`,
  };
}

function AuthorBlock({ doc, titleAlign, plain }) {
  const authorAlign = doc.authorAlign || 'split';
  const authorColor = plain ? '#111827' : '#9ca3af';

  if (authorAlign === 'split') {
    return (
      <div
        style={{
          marginTop: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          fontSize: '0.82em',
          color: authorColor,
        }}
      >
        <span style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>
          {doc.author}
        </span>
        <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
          {doc.date}
        </span>
      </div>
    );
  }

  const resolved = authorAlign === 'title' ? titleAlign : authorAlign;

  return (
    <div
      style={{
        marginTop: 14,
        fontSize: '0.82em',
        color: authorColor,
        textAlign: resolved,
      }}
    >
      <div style={{ whiteSpace: 'pre-wrap' }}>{doc.author}</div>
      <div style={{ marginTop: 2 }}>{doc.date}</div>
    </div>
  );
}

function CoverPage({ doc, plain, update, zoom }) {
  const onDragTitle = useDrag('title', doc, update, zoom);
  const onDragLogo = useDrag('logo', doc, update, zoom);
  const align = doc.titleAlign || 'left';
  const locked = !!doc.locked;
  const canDrag = !locked;
  const titleScale = doc.titleScale || 1;
  const logoSize = doc.logoSize || 56;
  const gap = doc.subtitleGap ?? 8;

  return (
    <div
      data-block
      style={{
        height: PAGE_SIZES[doc.pageSize][doc.orientation === 'landscape' ? 'w' : 'h'],
        padding: 80,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: align === 'left' ? 'left' : align === 'right' ? 'right' : 'center',
        background: plain
          ? '#ffffff'
          : `linear-gradient(135deg, ${doc.accent}10 0%, ${doc.accent}00 60%)`,
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      {doc.logo && (
        <img
          src={doc.logo}
          alt=""
          onPointerDown={onDragLogo}
          title={canDrag ? 'Geser logo untuk memindahkan' : 'Terkunci'}
          style={{
            maxHeight: Math.round(logoSize * 1.6),
            maxWidth: Math.round(logoSize * 1.6 * 2.4),
            objectFit: 'contain',
            marginBottom: 48,
            ...draggableStyle(
              { x: doc.logoOffsetX, y: doc.logoOffsetY },
              locked
            ),
          }}
        />
      )}
      {!plain && (
        <div style={{ height: 6, width: 64, background: doc.accent, borderRadius: 4, marginBottom: 32 }} />
      )}

      <div
        onPointerDown={onDragTitle}
        title={canDrag ? 'Geser judul untuk memindahkan' : 'Terkunci'}
        style={{
          ...draggableStyle(
            { x: doc.titleOffsetX, y: doc.titleOffsetY },
            locked
          ),
          alignSelf: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
          textAlign: align,
          maxWidth: '100%',
        }}
      >
        <h1
          style={{
            fontSize: `${2.8 * titleScale}em`,
            fontWeight: 800,
            color: plain ? '#111827' : '#0f172a',
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          {doc.title || ' '}
        </h1>
        {doc.subtitle && (
          <p
            style={{
              margin: `${gap}px 0 0`,
              fontSize: '1.15em',
              color: '#64748b',
              whiteSpace: 'pre-wrap',
            }}
          >
            {doc.subtitle}
          </p>
        )}
      </div>

      <div style={{ marginTop: 64, fontSize: '0.9em', color: '#64748b', width: '100%' }}>
        <div style={{ textAlign: align }}>
          <div
            style={{
              fontWeight: 600,
              color: plain ? '#111827' : '#334155',
              whiteSpace: 'pre-wrap',
            }}
          >
            {doc.author}
          </div>
          <div>{doc.date}</div>
        </div>
      </div>
    </div>
  );
}

function ContentSections({ doc, plain, update, zoom }) {
  const onDragTitle = useDrag('title', doc, update, zoom);
  const onDragLogo = useDrag('logo', doc, update, zoom);
  const align = doc.titleAlign || 'left';
  const locked = !!doc.locked;
  const canDrag = !locked;
  const logoSize = doc.logoSize || 56;
  const gap = doc.subtitleGap ?? 8;

  return (
    <>
      {doc.headerText && (
        <div
          data-block
          style={{
            fontSize: '0.75em',
            color: '#94a3b8',
            marginBottom: 32,
            paddingBottom: 8,
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          {doc.headerText}
        </div>
      )}

      {!doc.showCover && (
        <header
          data-block
          style={{
            borderBottom: plain ? 'none' : `2px solid ${doc.accent}`,
            paddingBottom: plain ? 0 : 20,
            marginBottom: 32,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 20,
          }}
        >
          {doc.logo && (
            <img
              src={doc.logo}
              alt=""
              onPointerDown={onDragLogo}
              title={canDrag ? 'Geser logo untuk memindahkan' : 'Terkunci'}
              style={{
                height: logoSize,
                maxWidth: logoSize * 2.4,
                objectFit: 'contain',
                flexShrink: 0,
                ...draggableStyle(
                  { x: doc.logoOffsetX, y: doc.logoOffsetY },
                  locked
                ),
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              onPointerDown={onDragTitle}
              title={canDrag ? 'Geser judul untuk memindahkan' : 'Terkunci'}
              style={{
                ...draggableStyle(
                  { x: doc.titleOffsetX, y: doc.titleOffsetY },
                  locked
                ),
                textAlign: align,
              }}
            >
              <h1
                style={{
                  fontSize: `${2 * (doc.titleScale || 1)}em`,
                  fontWeight: 800,
                  color: plain ? '#111827' : doc.accent,
                  margin: 0,
                  lineHeight: 1.15,
                }}
              >
                {doc.title || ' '}
              </h1>
              {doc.subtitle && (
                <p
                  style={{
                    margin: `${gap}px 0 0`,
                    color: '#6b7280',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {doc.subtitle}
                </p>
              )}
            </div>
            <AuthorBlock doc={doc} titleAlign={align} plain={plain} />
          </div>
        </header>
      )}

      {doc.sections.map((s, i) => (
        <section
          key={i}
          data-block
          data-page-break={s.breakBefore ? 'true' : 'false'}
          style={{
            marginBottom: 28,
            pageBreakInside: 'avoid',
          }}
        >
          <SectionHeading
            text={s.heading}
            style={doc.headingStyle}
            color={doc.accent}
            plain={plain}
          />
          <p
            style={{
              whiteSpace: 'pre-wrap',
              margin: 0,
              textAlign: s.align || 'left',
              color: '#1f2937',
            }}
          >
            {s.body}
          </p>
        </section>
      ))}

      {doc.footerText && (
        <footer
          data-block
          style={{
            marginTop: 48,
            paddingTop: 14,
            borderTop: '1px solid #e5e7eb',
            fontSize: '0.78em',
            color: '#9ca3af',
            textAlign: 'center',
          }}
        >
          {doc.footerText}
        </footer>
      )}
    </>
  );
}

function SectionHeading({ text, style: s, color, plain }) {
  if (!text) return null;

  if (plain) {
    return (
      <h2
        style={{
          fontSize: '1.15em',
          fontWeight: 700,
          color: '#111827',
          margin: '0 0 10px',
        }}
      >
        {text}
      </h2>
    );
  }

  if (s === 'fill') {
    return (
      <h2
        style={{
          display: 'inline-block',
          fontSize: '1.2em',
          fontWeight: 700,
          color: '#fff',
          background: color,
          padding: '6px 14px',
          borderRadius: 6,
          margin: '0 0 12px',
        }}
      >
        {text}
      </h2>
    );
  }

  if (s === 'line') {
    return (
      <h2
        style={{
          fontSize: '1.25em',
          fontWeight: 700,
          color: '#0f172a',
          margin: '0 0 12px',
          paddingBottom: 6,
          borderBottom: `2px solid ${color}`,
          display: 'inline-block',
        }}
      >
        <span style={{ color }}>—</span> {text}
      </h2>
    );
  }

  return (
    <h2 style={{ fontSize: '1.25em', fontWeight: 700, color, margin: '0 0 10px' }}>
      {text}
    </h2>
  );
}
