import { detectBlocks } from './table-detect';

export async function extractTextFromPdf(file, onProgress) {
  const pdfjsLib = await import('pdfjs-dist');
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }

  onProgress?.(5, 'Membaca file PDF…');
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  onProgress?.(10, `${totalPages} halaman`);

  const pageBlocks = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const items = content.items
      .filter((it) => it.str && it.str.trim())
      .map((it) => ({
        str: it.str,
        x: it.transform[4],
        y: it.transform[5],
        width: it.width || 0,
      }));

    const blocks = detectBlocks(items);
    pageBlocks.push(blocks);

    const pct = 10 + Math.floor((i / totalPages) * 65);
    onProgress?.(pct, `Halaman ${i} / ${totalPages}…`);
  }

  onProgress?.(80, 'Merapikan…');
  const sections = blocksToSections(pageBlocks);

  const rawText = pageBlocks
    .map((blocks) =>
      blocks
        .map((b) =>
          b.type === 'text'
            ? b.text
            : b.rows.map((r) => r.join(' | ')).join('\n')
        )
        .join('\n')
    )
    .join('\n\n');

  return { totalPages, rawText, sections };
}

function blocksToSections(pageBlocks) {
  const sections = [];
  let current = { heading: '', bodyParts: [] };
  let buffer = '';

  const flushBuffer = () => {
    if (buffer.trim()) {
      current.bodyParts.push(buffer.trim());
      buffer = '';
    }
  };

  const flushSection = () => {
    flushBuffer();
    if (current.heading || current.bodyParts.length) {
      sections.push({
        heading: current.heading,
        body: current.bodyParts.join('\n\n'),
      });
    }
    current = { heading: '', bodyParts: [] };
  };

  const isHeading = (t) => {
    if (!t || t.length < 3 || t.length > 70) return false;
    if (/[.!?,;:]$/.test(t)) return false;
    if (/^[-•*]\s/.test(t)) return false;
    const letters = t.replace(/[^A-Za-z]/g, '');
    if (letters.length >= 4 && letters === letters.toUpperCase()) return true;
    if (/^BAB\s+[IVXLC0-9]+\b/i.test(t)) return true;
    if (/^[A-Z]\.\s+\S/.test(t)) return true;
    if (/^\d+(\.\d+)*\.?\s+\S/.test(t) && t.split(' ').length <= 6) return true;
    return false;
  };

  for (const blocks of pageBlocks) {
    for (const block of blocks) {
      if (block.type === 'table') {
        flushSection();
        sections.push({
          heading: '',
          tableData: {
            headerRow: false,
            numbering: false,
            rows: block.rows,
          },
        });
        continue;
      }

      const line = (block.text || '').trim();
      if (!line) continue;

      if (isHeading(line)) {
        flushSection();
        current.heading = line;
      } else {
        if (buffer && /[.!?]$/.test(buffer)) {
          flushBuffer();
          buffer = line;
        } else if (buffer) {
          buffer += ' ' + line;
        } else {
          buffer = line;
        }
      }
    }
    flushSection();
  }

  flushSection();
  return sections.filter(
    (s) => s.heading || (s.body && s.body.trim()) || s.tableData
  );
}

export function sectionsToDocSections(sections) {
  const ts = Date.now();
  return sections.map((s, i) => {
    const isTable = !!s.tableData;
    return {
      id: 'imp_' + ts + '_' + i + '_' + Math.random().toString(36).slice(2, 6),
      type: isTable ? 'table' : 'text',
      heading: s.heading || '',
      body: isTable ? '' : (s.body || ''),
      align: 'left',
      breakBefore: false,
      offsetX: 0,
      offsetY: 0,
      fontFamily: '',
      fontSize: 0,
      tableData: isTable ? s.tableData : null,
    };
  });
}
