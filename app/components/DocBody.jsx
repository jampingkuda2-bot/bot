'use client';

import {
  AlignLeft, AlignCenter, AlignRight, ArrowLeftRight,
} from 'lucide-react';
import { PAGE_SIZES } from '../lib/constants';
import DragTarget from './DragTarget';

const TITLE_ALIGN_OPTS = [
  { value: 'left',   title: 'Rata kiri',   icon: AlignLeft },
  { value: 'center', title: 'Rata tengah', icon: AlignCenter },
  { value: 'right',  title: 'Rata kanan',  icon: AlignRight },
];

const AUTHOR_ALIGN_OPTS = [
  { value: 'split',  title: 'Terpisah',    icon: ArrowLeftRight },
  { value: 'left',   title: 'Rata kiri',   icon: AlignLeft },
  { value: 'center', title: 'Rata tengah', icon: AlignCenter },
  { value: 'right',  title: 'Rata kanan',  icon: AlignRight },
];

const SUBTITLE_COLOR = '#111827';
const AUTHOR_COLOR = '#111827';

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
          <ContentSections doc={d} plain={isPlain} update={update} zoom={zoom} />
        </div>
      </>
    );
  }

  return <ContentSections doc={d} plain={isPlain} update={update} zoom={zoom} />;
}

function hasTitle(doc) {
  return !!(doc.title && doc.title.trim()) || !!(doc.subtitle && doc.subtitle.trim());
}

function hasAuthor(doc) {
  return !!(doc.author && doc.author.trim()) || !!(doc.date && doc.date.trim());
}

function LogoImg({ doc, update, zoom, size }) {
  return (
    <DragTarget
      id="logo"
      doc={doc}
      update={update}
      zoom={zoom}
      style={{ display: 'inline-block', flexShrink: 0, alignSelf: 'flex-end' }}
      onDelete={() => update({ logo: null })}
      deleteTitle="Hapus logo"
    >
      <img
        src={doc.logo}
        alt=""
        draggable={false}
        style={{
          height: size,
          maxWidth: size * 2.4,
          objectFit: 'contain',
          display: 'block',
          userSelect: 'none',
        }}
      />
    </DragTarget>
  );
}

function TitleBlock({ doc, update, zoom, plain, size, align }) {
  if (!hasTitle(doc)) return null;
  const gap = doc.subtitleGap ?? 8;
  return (
    <DragTarget
      id="title"
      doc={doc}
      update={update}
      zoom={zoom}
      alignKey="titleAlign"
      alignOptions={TITLE_ALIGN_OPTS}
      style={{ textAlign: align, width: '100%' }}
      onDelete={() => update({ title: '', subtitle: '' })}
      deleteTitle="Hapus judul & subjudul"
    >
      <h1
        style={{
          fontSize: `${size}em`,
          fontWeight: 800,
          color: plain ? '#111827' : doc.accent,
          margin: 0,
          lineHeight: 1.15,
        }}
      >
        {doc.title || ''}
      </h1>
      {doc.subtitle && (
        <p
          style={{
            margin: `${gap}px 0 0`,
            color: SUBTITLE_COLOR,
            whiteSpace: 'pre-wrap',
            fontSize: '1em',
            fontWeight: 400,
          }}
        >
          {doc.subtitle}
        </p>
      )}
    </DragTarget>
  );
}

function AuthorBlock({ doc, update, zoom }) {
  if (!hasAuthor(doc)) return null;
  const align = doc.authorAlign || 'split';
  const size = doc.authorFontSize || 0.82;
  const fam = doc.authorFontFamily || 'inherit';

  return (
    <DragTarget
      id="author"
      doc={doc}
      update={update}
      zoom={zoom}
      alignKey="authorAlign"
      alignOptions={AUTHOR_ALIGN_OPTS}
      style={{
        marginTop: 14,
        fontSize: `${size}em`,
        color: AUTHOR_COLOR,
        fontFamily: fam,
        width: '100%',
        paddingTop: 4,
        paddingBottom: 4,
      }}
      onDelete={() => update({ author: '', date: '' })}
      deleteTitle="Hapus penulis & tanggal"
    >
      {align === 'split' ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <span style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>
            {doc.author || ''}
          </span>
          <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
            {doc.date || ''}
          </span>
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

function CoverPage({ doc, plain, update, zoom }) {
  const align = doc.titleAlign || 'left';
  const titleScale = doc.titleScale || 1;
  const logoSize = doc.logoSize || 56;

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
        textAlign: align,
        background: plain
          ? '#ffffff'
          : `linear-gradient(135deg, ${doc.accent}10 0%, ${doc.accent}00 60%)`,
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      {doc.logo && (
        <div style={{ marginBottom: 48, alignSelf: 'center' }}>
          <LogoImg doc={doc} update={update} zoom={zoom} size={Math.round(logoSize * 1.6)} />
        </div>
      )}
      {!plain && (
        <div
          style={{
            height: 6,
            width: 64,
            background: doc.accent,
            borderRadius: 4,
            marginBottom: 32,
          }}
        />
      )}
      <div style={{ width: '100%' }}>
        <TitleBlock
          doc={doc}
          update={update}
          zoom={zoom}
          plain={plain}
          size={2.8 * titleScale}
          align={align}
        />
      </div>
      <div style={{ marginTop: 64, width: '100%' }}>
        <AuthorBlock doc={doc} update={update} zoom={zoom} />
      </div>
    </div>
  );
}

function ContentSections({ doc, plain, update, zoom }) {
  const align = doc.titleAlign || 'left';
  const logoSize = doc.logoSize || 56;
  const showHeader = doc.logo || hasTitle(doc) || hasAuthor(doc);

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

      {!doc.showCover && showHeader && (
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
            <LogoImg doc={doc} update={update} zoom={zoom} size={logoSize} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <TitleBlock
              doc={doc}
              update={update}
              zoom={zoom}
              plain={plain}
              size={2 * (doc.titleScale || 1)}
              align={align}
            />
            <AuthorBlock doc={doc} update={update} zoom={zoom} />
          </div>
        </header>
      )}

      {doc.sections.map((s, i) => (
        <section
          key={i}
          data-block
          data-page-break={s.breakBefore ? 'true' : 'false'}
          style={{ marginBottom: 28, pageBreakInside: 'avoid' }}
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
      <h2 style={{ fontSize: '1.15em', fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>
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
