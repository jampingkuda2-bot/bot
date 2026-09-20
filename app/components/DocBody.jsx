'use client';

import { useRef, useCallback } from 'react';
import { PAGE_SIZES } from '../lib/constants';
import DragTarget from './DragTarget';

const SUBTITLE_COLOR = '#111827';
const AUTHOR_COLOR = '#111827';

function hasTitle(doc) {
  return !!(doc.title && doc.title.trim()) || !!(doc.subtitle && doc.subtitle.trim());
}
function hasAuthor(doc) {
  return !!(doc.author && doc.author.trim()) || !!(doc.date && doc.date.trim());
}
function sectionHasContent(s) {
  if (s.type === 'table') {
    if (s.heading && s.heading.trim()) return true;
    const rows = s.tableData?.rows || [];
    return rows.some((row) => row.some((cell) => cell && cell.trim()));
  }
  return !!(s.heading && s.heading.trim()) || !!(s.body && s.body.trim());
}
function hasPostCoverContent(doc) {
  if (doc.headerText && doc.headerText.trim()) return true;
  if (doc.footerText && doc.footerText.trim()) return true;
  return doc.sections.some(sectionHasContent);
}

export default function DocBody({ doc, update, zoom = 1, selected, onSelect }) {
  const isPlain = !!doc.plain;
  const d = isPlain
    ? { ...doc, accent: '#111827', headingStyle: 'plain' }
    : doc;
  const p = d.margin;

  const patchSectionById = useCallback((id, patch) => {
    const arr = doc.sections.map((x) => (x.id === id ? { ...x, ...patch } : x));
    update({ sections: arr });
  }, [doc, update]);

  if (d.showCover) {
    return (
      <>
        <CoverPage doc={d} plain={isPlain} update={update} zoom={zoom} selected={selected} onSelect={onSelect} />
        {hasPostCoverContent(d) && (
          <div style={{ padding: p, position: 'relative' }}>
            <ContentSections
              doc={d} plain={isPlain} update={update} zoom={zoom}
              selected={selected} onSelect={onSelect}
              patchSectionById={patchSectionById}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <ContentSections
      doc={d} plain={isPlain} update={update} zoom={zoom}
      selected={selected} onSelect={onSelect}
      patchSectionById={patchSectionById}
    />
  );
}

function SectionWrapper({ section, locked, zoom, selected, onSelect, onChange, children }) {
  const draggingRef = useRef(false);
  const offsetX = section.offsetX || 0;
  const offsetY = section.offsetY || 0;

  const onPointerDown = useCallback((e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest && e.target.closest('[data-toolbar]')) return;

    if (onSelect) onSelect();
    if (locked) return;
    if (!selected) return;

    e.preventDefault();
    e.stopPropagation();

    draggingRef.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = offsetX;
    const origY = offsetY;
    const scale = zoom || 1;

    const move = (ev) => {
      if (!draggingRef.current) return;
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      onChange({
        offsetX: Math.round(origX + dx),
        offsetY: Math.round(origY + dy),
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
  }, [offsetX, offsetY, locked, zoom, onChange, onSelect, selected]);

  const isDraggable = selected && !locked;
  const sectionFont = section.fontFamily || 'inherit';
  const sectionSize = section.fontSize && section.fontSize > 0
    ? `${section.fontSize}px`
    : 'inherit';

  return (
    <div
      data-draggable={isDraggable ? `sec_${section.id}` : undefined}
      onPointerDown={onPointerDown}
      style={{
        cursor: isDraggable ? 'move' : 'pointer',
        touchAction: isDraggable ? 'none' : 'auto',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transform: `translate(${offsetX}px, ${offsetY}px)`,
        outline: selected && !locked ? '2px solid rgba(37,99,235,0.85)' : 'none',
        outlineOffset: 4,
        borderRadius: 4,
        fontFamily: sectionFont,
        fontSize: sectionSize,
      }}
    >
      {children}
    </div>
  );
}

function LogoImg({ doc, update, zoom, size, selected, onSelect }) {
  return (
    <DragTarget
      id="logo" doc={doc} update={update} zoom={zoom}
      selected={selected === 'logo'} onSelect={onSelect}
      style={{ display: 'inline-block', flexShrink: 0, alignSelf: 'flex-end' }}
    >
      <img
        src={doc.logo} alt="" draggable={false}
        style={{
          height: size, maxWidth: size * 2.4, objectFit: 'contain',
          display: 'block', userSelect: 'none',
        }}
      />
    </DragTarget>
  );
}

function TitleBlock({ doc, update, zoom, plain, size, align, selected, onSelect }) {
  if (!hasTitle(doc)) return null;
  const gap = doc.subtitleGap ?? 8;
  return (
    <DragTarget
      id="title" doc={doc} update={update} zoom={zoom}
      selected={selected === 'title'} onSelect={onSelect}
      style={{ textAlign: align, width: '100%' }}
    >
      <h1 style={{
        fontSize: `${size}em`, fontWeight: 800,
        color: plain ? '#111827' : doc.accent,
        margin: 0, lineHeight: 1.15,
      }}>{doc.title || ''}</h1>
      {doc.subtitle && (
        <p style={{
          margin: `${gap}px 0 0`, color: SUBTITLE_COLOR,
          whiteSpace: 'pre-wrap', fontSize: '1em', fontWeight: 400,
        }}>{doc.subtitle}</p>
      )}
    </DragTarget>
  );
}

function AuthorBlock({ doc, update, zoom, selected, onSelect }) {
  if (!hasAuthor(doc)) return null;
  const align = doc.authorAlign || 'split';
  const size = doc.authorFontSize || 0.82;
  const fam = doc.authorFontFamily || 'inherit';

  return (
    <DragTarget
      id="author" doc={doc} update={update} zoom={zoom}
      selected={selected === 'author'} onSelect={onSelect}
      style={{
        marginTop: 14, fontSize: `${size}em`, color: AUTHOR_COLOR,
        fontFamily: fam, width: '100%', paddingTop: 4, paddingBottom: 4,
      }}
    >
      {align === 'split' ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <span style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>{doc.author || ''}</span>
          <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>{doc.date || ''}</span>
        </div>
      ) : (
        <div style={{ textAlign: align }}>
          <div style={{ whiteSpace: 'pre-wrap' }}>{doc.author || ''}</div>
          <div style={{ marginTop: 2 }}>{doc.date || ''}</div>
        </div>
      )}
    </DragTarget>
  );
}

function CoverPage({ doc, plain, update, zoom, selected, onSelect }) {
  const align = doc.titleAlign || 'left';
  const titleScale = doc.titleScale || 1;
  const logoSize = doc.logoSize || 56;

  return (
    <div
      data-block
      style={{
        height: PAGE_SIZES[doc.pageSize][doc.orientation === 'landscape' ? 'w' : 'h'],
        padding: 80, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', textAlign: align,
        background: plain ? '#ffffff'
          : `linear-gradient(135deg, ${doc.accent}10 0%, ${doc.accent}00 60%)`,
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      {doc.logo && (
        <div style={{ marginBottom: 48, alignSelf: 'center' }}>
          <LogoImg doc={doc} update={update} zoom={zoom} size={Math.round(logoSize * 1.6)} selected={selected} onSelect={onSelect} />
        </div>
      )}
      {!plain && <div style={{ height: 6, width: 64, background: doc.accent, borderRadius: 4, marginBottom: 32 }} />}
      <div style={{ width: '100%' }}>
        <TitleBlock doc={doc} update={update} zoom={zoom} plain={plain} size={2.8 * titleScale} align={align} selected={selected} onSelect={onSelect} />
      </div>
      <div style={{ marginTop: 64, width: '100%' }}>
        <AuthorBlock doc={doc} update={update} zoom={zoom} selected={selected} onSelect={onSelect} />
      </div>
    </div>
  );
}

function ContentSections({ doc, plain, update, zoom, selected, onSelect, patchSectionById }) {
  const align = doc.titleAlign || 'left';
  const logoSize = doc.logoSize || 56;
  const showHeader = doc.logo || hasTitle(doc) || hasAuthor(doc);
  const visibleSections = doc.sections.filter(sectionHasContent);
  const locked = !!doc.locked;

  return (
    <>
      {doc.headerText && doc.headerText.trim() && (
        <div data-block style={{
          fontSize: '0.75em', color: '#94a3b8', marginBottom: 32,
          paddingBottom: 8, borderBottom: '1px solid #f1f5f9',
        }}>{doc.headerText}</div>
      )}

      {!doc.showCover && showHeader && (
        <header data-block style={{
          borderBottom: plain ? 'none' : `2px solid ${doc.accent}`,
          paddingBottom: plain ? 0 : 20, marginBottom: 32,
          display: 'flex', alignItems: 'flex-end', gap: 20,
        }}>
          {doc.logo && <LogoImg doc={doc} update={update} zoom={zoom} size={logoSize} selected={selected} onSelect={onSelect} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <TitleBlock doc={doc} update={update} zoom={zoom} plain={plain} size={2 * (doc.titleScale || 1)} align={align} selected={selected} onSelect={onSelect} />
            <AuthorBlock doc={doc} update={update} zoom={zoom} selected={selected} onSelect={onSelect} />
          </div>
        </header>
      )}

      {visibleSections.map((s) => (
        <SectionWrapper
          key={s.id}
          section={s}
          locked={locked}
          zoom={zoom}
          selected={selected === 'sec_' + s.id}
          onSelect={() => onSelect && onSelect('sec_' + s.id)}
          onChange={(patch) => patchSectionById(s.id, patch)}
        >
          <div
            data-block
            data-page-break={s.breakBefore ? 'true' : 'false'}
            style={{ marginBottom: 28, pageBreakInside: 'avoid' }}
          >
            <SectionHeading text={s.heading} style={doc.headingStyle} color={doc.accent} plain={plain} />

            {s.type === 'table' ? (
              <TableBlock
                tableData={s.tableData}
                accent={doc.accent}
                plain={plain}
                align={s.align || 'left'}
              />
            ) : (
              s.body && (
                <p style={{
                  whiteSpace: 'pre-wrap', margin: 0,
                  textAlign: s.align || 'left', color: '#1f2937',
                }}>{s.body}</p>
              )
            )}
          </div>
        </SectionWrapper>
      ))}

      {doc.footerText && doc.footerText.trim() && (
        <footer data-block style={{
          marginTop: 48, paddingTop: 14, borderTop: '1px solid #e5e7eb',
          fontSize: '0.78em', color: '#9ca3af', textAlign: 'center',
        }}>{doc.footerText}</footer>
      )}
    </>
  );
}

function TableBlock({ tableData, accent, plain, align }) {
  const rows = tableData?.rows || [];
  const headerRow = tableData?.headerRow !== false;
  if (rows.length === 0 || rows[0].length === 0) return null;

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
    }}>
      <table style={{
        borderCollapse: 'collapse',
        width: '100%',
        fontSize: '0.92em',
        pageBreakInside: 'avoid',
      }}>
        <tbody>
          {rows.map((row, ri) => {
            const isHeader = headerRow && ri === 0;
            return (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      border: '1px solid #d1d5db',
                      padding: '6px 10px',
                      textAlign: 'left',
                      verticalAlign: 'top',
                      color: isHeader ? '#ffffff' : '#1f2937',
                      background: isHeader
                        ? (plain ? '#111827' : accent)
                        : '#ffffff',
                      fontWeight: isHeader ? 600 : 400,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {cell || '\u00A0'}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SectionHeading({ text, style: s, color, plain }) {
  if (!text || !text.trim()) return null;

  if (plain) {
    return <h2 style={{ fontSize: '1.15em', fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>{text}</h2>;
  }

  if (s === 'fill') {
    return (
      <h2 style={{
        display: 'inline-block', fontSize: '1.2em', fontWeight: 700,
        color: '#fff', background: color, padding: '6px 14px',
        borderRadius: 6, margin: '0 0 12px',
      }}>{text}</h2>
    );
  }

  if (s === 'line') {
    return (
      <h2 style={{
        fontSize: '1.25em', fontWeight: 700, color: '#0f172a',
        margin: '0 0 12px', paddingBottom: 6,
        borderBottom: `2px solid ${color}`, display: 'inline-block',
      }}>
        <span style={{ color }}>—</span> {text}
      </h2>
    );
  }

  return <h2 style={{ fontSize: '1.25em', fontWeight: 700, color, margin: '0 0 10px' }}>{text}</h2>;
            }
