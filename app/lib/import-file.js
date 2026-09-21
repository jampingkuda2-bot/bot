import { extractTextFromPdf, sectionsToDocSections } from './pdf-import';

export async function importAnyFile(file, onProgress) {
  const ext = (file.name.toLowerCase().split('.').pop() || '');
  if (ext === 'pdf') return importPdf(file, onProgress);
  if (ext === 'docx') return importDocx(file, onProgress);
  if (ext === 'html' || ext === 'htm') return importHtml(file, onProgress);
  if (ext === 'txt') return importTxt(file, onProgress);
  if (ext === 'md' || ext === 'markdown') return importMd(file, onProgress);
  throw new Error(`Format .${ext} belum didukung`);
}

/* ---------- PDF ---------- */
async function importPdf(file, onProgress) {
  const res = await extractTextFromPdf(file, onProgress);
  return {
    totalPages: res.totalPages,
    sourceName: file.name,
    sections: res.sections,
    rawText: res.rawText,
  };
}

/* ---------- DOCX ---------- */
async function importDocx(file, onProgress) {
  onProgress?.(20, 'Membaca DOCX…');
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  onProgress?.(70, 'Merapikan struktur…');
  const html = result.value || '';
  const sections = htmlToSections(html);
  return {
    totalPages: 1,
    sourceName: file.name,
    sections,
    rawText: sections.map(s => (s.heading ? s.heading + '\n' : '') + s.body).join('\n\n'),
  };
}

/* ---------- HTML ---------- */
async function importHtml(file, onProgress) {
  onProgress?.(30, 'Membaca HTML…');
  const text = await file.text();
  const sections = htmlToSections(text);
  onProgress?.(80, 'Merapikan…');
  return {
    totalPages: 1,
    sourceName: file.name,
    sections,
    rawText: sections.map(s => (s.heading ? s.heading + '\n' : '') + s.body).join('\n\n'),
  };
}

/* ---------- TXT ---------- */
async function importTxt(file, onProgress) {
  onProgress?.(40, 'Membaca teks…');
  const text = await file.text();
  const sections = plainTextToSections(text);
  return { totalPages: 1, sourceName: file.name, sections, rawText: text };
}

/* ---------- MD ---------- */
async function importMd(file, onProgress) {
  onProgress?.(40, 'Membaca markdown…');
  const text = await file.text();
  const sections = markdownToSections(text);
  return { totalPages: 1, sourceName: file.name, sections, rawText: text };
}

/* ============================================================
   HELPERS
   ============================================================ */

function htmlToSections(html) {
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, 'text/html');
  const body = dom.body;
  const out = [];
  let current = { heading: '', bodyParts: [] };

  const flush = () => {
    if (current.heading || current.bodyParts.length) {
      out.push({
        heading: current.heading,
        body: current.bodyParts.join('\n\n').trim(),
      });
    }
    current = { heading: '', bodyParts: [] };
  };

  const walk = (node) => {
    if (!node) return;
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        const t = child.textContent.trim();
        if (t) current.bodyParts.push(t);
        return;
      }
      if (child.nodeType !== 1) return;

      const tag = child.tagName.toLowerCase();

      if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
        flush();
        current.heading = child.textContent.trim();
        return;
      }

      if (tag === 'ul' || tag === 'ol') {
        const items = Array.from(child.querySelectorAll('li'))
          .map((li) => li.textContent.trim())
          .filter(Boolean);
        if (items.length) {
          const bulleted = tag === 'ul'
            ? items.map((t) => `• ${t}`).join('\n')
            : items.map((t, i) => `${i + 1}. ${t}`).join('\n');
          current.bodyParts.push(bulleted);
        }
        return;
      }

      if (tag === 'table') {
        const rows = Array.from(child.querySelectorAll('tr')).map((tr) =>
          Array.from(tr.querySelectorAll('td, th')).map((td) => td.textContent.trim())
        );
        if (rows.length) {
          const text = rows.map((r) => r.join(' | ')).join('\n');
          current.bodyParts.push(text);
        }
        return;
      }

      if (tag === 'p' || tag === 'div' || tag === 'section' || tag === 'article') {
        const inner = child.textContent.trim();
        if (inner) {
          const hasBlockChild = child.querySelector('h1,h2,h3,h4,ul,ol,p,div');
          if (hasBlockChild) walk(child);
          else current.bodyParts.push(inner);
        }
        return;
      }

      if (tag === 'br') {
        current.bodyParts.push('');
        return;
      }

      if (tag === 'li') return;

      walk(child);
    });
  };

  walk(body);
  flush();

  return out.filter((s) => s.heading || s.body);
}

function markdownToSections(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let current = { heading: '', bodyParts: [] };
  let listBuffer = [];
  let listMode = null;

  const flushList = () => {
    if (listBuffer.length) {
      if (listMode === 'ol') {
        current.bodyParts.push(listBuffer.map((t, i) => `${i + 1}. ${t}`).join('\n'));
      } else {
        current.bodyParts.push(listBuffer.map((t) => `• ${t}`).join('\n'));
      }
      listBuffer = [];
      listMode = null;
    }
  };

  const flushSection = () => {
    flushList();
    if (current.heading || current.bodyParts.length) {
      out.push({ heading: current.heading, body: current.bodyParts.join('\n\n').trim() });
    }
    current = { heading: '', bodyParts: [] };
  };

  let paragraph = [];

  const flushPara = () => {
    if (paragraph.length) {
      current.bodyParts.push(paragraph.join(' ').trim());
      paragraph = [];
    }
  };

  lines.forEach((raw) => {
    const line = raw.trim();

    if (!line) {
      flushPara();
      flushList();
      return;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushPara();
      flushSection();
      current.heading = headingMatch[2].trim();
      return;
    }

    const ulMatch = line.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      flushPara();
      if (listMode === 'ol') flushList();
      listMode = 'ul';
      listBuffer.push(ulMatch[1].trim());
      return;
    }

    const olMatch = line.match(/^\d+[.)]\s+(.+)$/);
    if (olMatch) {
      flushPara();
      if (listMode === 'ul') flushList();
      listMode = 'ol';
      listBuffer.push(olMatch[1].trim());
      return;
    }

    flushList();
    paragraph.push(line);
  });

  flushPara();
  flushSection();

  return out.filter((s) => s.heading || s.body);
}

function plainTextToSections(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let current = { heading: '', bodyParts: [] };
  let paragraph = [];

  const flushPara = () => {
    if (paragraph.length) {
      current.bodyParts.push(paragraph.join(' ').trim());
      paragraph = [];
    }
  };

  const flushSection = () => {
    if (current.heading || current.bodyParts.length) {
      out.push({ heading: current.heading, body: current.bodyParts.join('\n\n').trim() });
    }
    current = { heading: '', bodyParts: [] };
  };

  const isLikelyHeading = (line) => {
    if (!line || line.length < 3 || line.length > 70) return false;
    if (/[.!?,;:]$/.test(line)) return false;
    if (/^[-•*]\s/.test(line)) return false;
    if (/^\d+[.)]\s/.test(line)) return false;
    const letters = line.replace(/[^A-Za-z]/g, '');
    if (letters.length >= 4 && letters === letters.toUpperCase()) return true;
    if (/^BAB\s+[IVXLC0-9]+\b/i.test(line)) return true;
    if (/^\d+(\.\d+)*\.?\s+\S/.test(line)) return true;
    return false;
  };

  lines.forEach((raw) => {
    const line = raw.trim();
    if (!line) {
      flushPara();
      return;
    }
    if (isLikelyHeading(line)) {
      flushPara();
      flushSection();
      current.heading = line;
      return;
    }
    paragraph.push(line);
  });

  flushPara();
  flushSection();

  return out.filter((s) => s.heading || s.body);
}

/* Export converter */
export { sectionsToDocSections };
