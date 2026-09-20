import { PAGE_SIZES } from '../lib/constants';

export default function DocBody({ doc }) {
  const isPlain = !!doc.plain;
  const d = isPlain
    ? { ...doc, accent: '#111827', headingStyle: 'plain' }
    : doc;
  const p = d.margin;

  if (d.showCover) {
    return (
      <>
        <CoverPage doc={d} plain={isPlain} />
        <div style={{ padding: p, position: 'relative' }}>
          <ContentSections doc={d} plain={isPlain} />
        </div>
      </>
    );
  }

  return (
    <div style={{ padding: p, position: 'relative' }}>
      <ContentSections doc={d} plain={isPlain} />
    </div>
  );
}

function CoverPage({ doc, plain }) {
  return (
    <div
      style={{
        height: PAGE_SIZES[doc.pageSize][doc.orientation === 'landscape' ? 'w' : 'h'],
        padding: 80,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
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
          style={{ maxHeight: 90, maxWidth: 220, objectFit: 'contain', marginBottom: 48 }}
        />
      )}
      {!plain && (
        <div style={{ height: 6, width: 64, background: doc.accent, borderRadius: 4, marginBottom: 32 }} />
      )}
      <h1
        style={{
          fontSize: '2.8em',
          fontWeight: 800,
          color: plain ? '#111827' : '#0f172a',
          margin: 0,
          lineHeight: 1.15,
        }}
      >
        {doc.title || ' '}
      </h1>
      {doc.subtitle && (
        <p style={{ marginTop: 16, fontSize: '1.15em', color: '#64748b', maxWidth: 520 }}>
          {doc.subtitle}
        </p>
      )}
      <div style={{ marginTop: 64, fontSize: '0.9em', color: '#64748b' }}>
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
  );
}

function ContentSections({ doc, plain }) {
  return (
    <>
      {doc.headerText && (
        <div
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
              style={{ height: 56, maxWidth: 120, objectFit: 'contain' }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: '2em',
                fontWeight: 800,
                color: plain ? '#111827' : doc.accent,
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              {doc.title || ' '}
            </h1>
            {doc.subtitle && (
              <p style={{ margin: '8px 0 0', color: '#6b7280' }}>{doc.subtitle}</p>
            )}
            <div
              style={{
                marginTop: 14,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
                fontSize: '0.82em',
                color: plain ? '#111827' : '#9ca3af',
              }}
            >
              <span style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>
                {doc.author}
              </span>
              <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                {doc.date}
              </span>
            </div>
          </div>
        </header>
      )}

      {doc.sections.map((s, i) => (
        <section
          key={i}
          style={{
            marginBottom: 28,
            pageBreakInside: 'avoid',
            ...(s.breakBefore && i > 0
              ? { pageBreakBefore: 'always', breakBefore: 'page' }
              : {}),
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
