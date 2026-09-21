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

async function importPdf(file, onProgress) {
  const res = await extractTextFromPdf(file, onProgress);
  return { totalPages: res.totalPages, sourceName: file.name, sections: res.sections, rawText: res.rawText };
}

async function importDocx(file, onProgress) {
  onProgress?.(20, 'Membaca DOCX…');
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  onProgress?.(70, 'Merapikan…');
  const sections = htmlToSections(result.value || '');
  return { totalPages: 1, sourceName: file.name, sections, rawText: '' };
}

async function importHtml(file, onProgress) {
  onProgress?.(30, 'Membaca HTML…');
  const text = await file.text();
  const sections = htmlToSections(text);
  onProgress?.(80, 'Merapikan…');
  return { totalPages: 1, sourceName: file.name, sections, rawText: '' };
}

async function importTxt(file, onProgress) {
  onProgress?.(40, 'Membaca teks…');
  const text = await file.text();
  const sections = plainTextToSections(text);
  return { totalPages: 1, sourceName: file.name, sections, rawText: text };
}

async function importMd(file, onProgress) {
  onProgress?.(40, 'Membaca markdown…');
  const text = await file.text();
  const sections = markdownToSections(text);
  return { totalPages: 1, sourceName: file.name, sections, rawText: text };
}

/* ============================================================
   HTML → sections (dengan tabel)
   ============================================================ */

function htmlToSections(html) {
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, 'text/html');
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

  const processNode = (node) => {
    if (node.nodeType === 3) {
      const t = node.textContent.trim();
      if (t) current.bodyParts.push(t);
      return;
    }
    if (node.nodeType !== 1) return;

    const tag = node.tagName.toLowerCase();

    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
      flush();
      current.heading = node.textContent.trim();
      return;
    }

    if (tag === 'table') {
      flush();
      const rows = extractTableRows(node);
      if (rows.length > 0) {
        out.push({
          heading: '',
          tableData: {
            headerRow: !!node.querySelector('th'),
            numbering: false,
            rows,
          },
        });
      }
      return;
    }

    if (tag === 'ul' || tag === 'ol') {
      const items = Array.from(node.querySelectorAll('li'))
        .map((li) => li.textContent.trim())
        .filter(Boolean);
      if (items.length) {
        const text = tag === 'ul'
          ? items.map((t) => `• ${t}`).join('\n')
          : items.map((t, i) => `${i + 1}. ${t}`).join('\n');
        current.bodyParts.push(text);
      }
      return;
    }

    if (tag === 'p' || tag === 'div' || tag === 'section' || tag === 'article') {
      const hasBlock = node.querySelector('h1,h2,h3,h4,table,ul,ol,p,div,section');
      if (hasBlock) {
        Array.from(node.childNodes).forEach(processNode);
      } else {
        const t = node.textContent.trim();
        if (t) current.bodyParts.push(t);
      }
      return;
    }

    if (tag === 'br') {
      current.bodyParts.push('');
      return;
    }

    if (tag === 'li') return;
    Array.from(node.childNodes).forEach(processNode);
  };

  Array.from(dom.body.childNodes).forEach(processNode);
  flush();
  return out.filter((s) => s.heading || s.body || s.tableData);
}

function extractTableRows(tableEl) {
  const trs = Array.from(tableEl.querySelectorAll('tr'));
  return trs
    .map((tr) => {
      const cells = Array.from(tr.querySelectorAll('td, th'));
      return cells.map((c) => c.textContent.trim());
    })
    .filter((row) => row.length > 0);
}

/* ============================================================
   Markdown → sections (dengan tabel)
   ============================================================ */

function markdownToSections(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let current = { heading: '', bodyParts: [] };
  let listBuffer = [];
  let listMode = null;
  let tableBuffer = [];

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

  const flushTable = () => {
    if (tableBuffer.length >= 2) {
      let rows = tableBuffer;
      let headerRow = false;
      if (rows.length >= 2 && rows[1].every((c) => /^[-:]+$/.test(c.trim()))) {
        headerRow = true;
        rows = [rows[0], ...rows.slice(2)];
      }
      out.push({
        heading: current.heading,
        tableData: { headerRow, numbering: false, rows },
      });
      current = { heading: '', bodyParts: [] };
    } else if (tableBuffer.length > 0) {
      tableBuffer.forEach((row) => current.bodyParts.push(row.join(' | ')));
    }
    tableBuffer = [];
  };

  const flushSection = () => {
    flushList();
    flushTable();
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
      flushTable();
      return;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushPara();
      flushSection();
      current.heading = headingMatch[2].trim();
      return;
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      flushPara();
      flushList();
      const cells = line.slice(1, -1).split('|').map((c) => c.trim());
      tableBuffer.push(cells);
      return;
    }

    if (tableBuffer.length) flushTable();

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
  return out.filter((s) => s.heading || s.body || s.tableData);
}

/* ============================================================
   Plain text → sections
   ============================================================ */

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
    if (!line) { flushPara(); return; }
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

export { sectionsToDocSections };
