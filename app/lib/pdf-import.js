/* Extract teks dari PDF dan auto-rapi jadi section */

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
  onProgress?.(10, `PDF berisi ${totalPages} halaman`);

  const pages = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const lines = [];
    let currentLine = null;
    let lastY = null;

    content.items.forEach((item) => {
      if (!item.str) return;
      const y = item.transform[5];

      if (lastY === null || Math.abs(y - lastY) > 3) {
        if (currentLine) lines.push(currentLine);
        currentLine = { y, items: [item] };
        lastY = y;
      } else {
        currentLine.items.push(item);
      }
    });
    if (currentLine) lines.push(currentLine);

    lines.sort((a, b) => b.y - a.y);

    const pageText = lines
      .map((line) => {
        const items = line.items.sort((a, b) => a.transform[4] - b.transform[4]);
        return items.map((it) => it.str).join('').trim();
      })
      .filter((l) => l.length > 0)
      .join('\n');

    pages.push(pageText);

    const pct = 10 + Math.floor((i / totalPages) * 60);
    onProgress?.(pct, `Memproses halaman ${i} / ${totalPages}…`);
  }

  onProgress?.(75, 'Merapikan teks…');
  const sections = autoStructure(pages);

  return {
    totalPages,
    rawText: pages.join('\n\n'),
    sections,
  };
}

/* Auto-rapi: deteksi heading, bab, list, paragraf */

function autoStructure(pages) {
  const allLines = pages.flatMap((p) => p.split('\n'));
  const sections = [];
  let currentHeading = '';
  let paragraphs = [];
  let buffer = '';

  const flushParagraph = () => {
    if (buffer.trim()) paragraphs.push(buffer.trim());
    buffer = '';
  };

  const pushSection = () => {
    if (currentHeading || paragraphs.length > 0) {
      sections.push({
        heading: currentHeading,
        body: paragraphs.join('\n\n'),
      });
    }
    paragraphs = [];
  };

  const isHeading = (line) => {
    const t = line.trim();
    if (!t || t.length < 3 || t.length > 70) return false;
    if (/[.!?,;]$/.test(t)) return false;

    // BAB I, BAB II, BAB 1
    if (/^BAB\s+[IVXLC0-9]+\b/i.test(t)) return true;

    // ALL CAPS (min 4 huruf)
    const letters = t.replace(/[^A-Za-z]/g, '');
    if (letters.length >= 4 && letters === letters.toUpperCase()) return true;

    // 1. Pendahuluan | 1.1 Latar
    if (/^\d+(\.\d+)*\.?\s+\S/.test(t)) return true;

    // A. Latar Belakang
    if (/^[A-Z]\.\s+\S/.test(t)) return true;

    // Baris pendek tanpa tanda baca akhir
    const words = t.split(/\s+/);
    if (words.length <= 8) return true;

    return false;
  };

  allLines.forEach((line) => {
    const t = line.trim();

    if (!t) {
      flushParagraph();
      return;
    }

    if (isHeading(t)) {
      flushParagraph();
      pushSection();
      currentHeading = t;
      return;
    }

    if (buffer) {
      if (/[.!?]$/.test(buffer)) {
        flushParagraph();
        buffer = t;
      } else {
        buffer += ' ' + t;
      }
    } else {
      buffer = t;
    }
  });

  flushParagraph();
  pushSection();

  return sections.filter((s) => s.heading || (s.body && s.body.trim()));
}

/* Convert hasil extract ke format section doc kita */

export function sectionsToDocSections(sections) {
  const ts = Date.now();
  return sections.map((s, i) => ({
    id: 'imp_' + ts + '_' + i + Math.random().toString(36).slice(2, 5),
    type: 'text',
    heading: s.heading || '',
    body: s.body || '',
    align: 'left',
    breakBefore: false,
    offsetX: 0,
    offsetY: 0,
    fontFamily: '',
    fontSize: 0,
    tableData: null,
  }));
}
