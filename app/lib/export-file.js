import { exportPdf } from './pdf';
import { slug } from './constants';

export const EXPORT_FORMATS = [
  { id: 'pdf',  label: 'PDF',   ext: '.pdf',  desc: 'Siap dicetak & dikirim' },
  { id: 'docx', label: 'DOCX',  ext: '.docx', desc: 'Bisa diedit di Word' },
  { id: 'html', label: 'HTML',  ext: '.html', desc: 'Buka di browser' },
  { id: 'md',   label: 'MD',    ext: '.md',   desc: 'Format Markdown' },
  { id: 'txt',  label: 'TXT',   ext: '.txt',  desc: 'Teks polos' },
  { id: 'json', label: 'JSON',  ext: '.json', desc: 'Backup / pindah device' },
];

export async function exportAs(element, doc, format, onProgress) {
  switch (format) {
    case 'pdf':  return exportPdf(element, doc, onProgress);
    case 'docx': return exportDocx(doc, onProgress);
    case 'html': return exportHtmlFile(doc, onProgress);
    case 'md':   return exportMd(doc, onProgress);
    case 'txt':  return exportTxt(doc, onProgress);
    case 'json': return exportJsonFile(doc, onProgress);
    default: throw new Error('Format tidak dikenal: ' + format);
  }
}

function download(data, filename, mime) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function baseName(doc) {
  return slug(doc.title || 'dokumen');
}

/* ============================================================
   DOCX — dengan tabel
   ============================================================ */

async function exportDocx(doc, onProgress) {
  onProgress?.('Menyiapkan DOCX…');
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
    Table, TableRow, TableCell, WidthType, BorderStyle,
  } = await import('docx');

  const children = [];

  /* ---------- Cover info ---------- */
  if (doc.title?.trim()) {
    children.push(new Paragraph({
      text: doc.title,
      heading: HeadingLevel.TITLE,
      alignment: alignToDocx(doc.titleAlign, AlignmentType),
      spacing: { after: 120 },
    }));
  }

  if (doc.subtitle?.trim()) {
    children.push(new Paragraph({
      children: [new TextRun({ text: doc.subtitle, size: 24, color: '555555' })],
      spacing: { after: 200 },
    }));
  }

  if (doc.author?.trim() || doc.date?.trim()) {
    children.push(new Paragraph({
      children: [
        new TextRun({ text: doc.author || '', bold: true, size: 20 }),
        new TextRun({ text: doc.date ? '    ' + doc.date : '', size: 20, color: '888888' }),
      ],
      spacing: { after: 300 },
    }));
  }

  /* ---------- Sections ---------- */
  doc.sections.forEach((s) => {
    const hasHeading = !!(s.heading && s.heading.trim());
    const isTable = s.type === 'table';
    const hasBody = !isTable && !!(s.body && s.body.trim());
    const hasTable = isTable && Array.isArray(s.tableData?.rows) && s.tableData.rows.length > 0;

    if (!hasHeading && !hasBody && !hasTable) return;

    /* Heading */
    if (hasHeading) {
      children.push(new Paragraph({
        text: s.heading,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      }));
    }

    /* Tabel */
    if (hasTable) {
      children.push(buildDocxTable(s.tableData, { Table, TableRow, TableCell, WidthType, BorderStyle, Paragraph, TextRun, AlignmentType }));
      children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
    }

    /* Body */
    if (hasBody) {
      const lines = s.body.split('\n');
      lines.forEach((line) => {
        const t = line.trim();
        if (!t) {
          children.push(new Paragraph({ text: '' }));
          return;
        }
        children.push(new Paragraph({
          text: t,
          spacing: { after: 100 },
          alignment: alignToDocx(s.align, AlignmentType),
        }));
      });
    }
  });

  const document = new Document({
    creator: doc.author || 'PDF Studio',
    title: doc.title || 'Dokumen',
    sections: [{ children }],
  });

  onProgress?.('Membuat file…');
  const blob = await Packer.toBlob(document);
  download(blob, baseName(doc) + '.docx');
}

function buildDocxTable(tableData, lib) {
  const { Table, TableRow, TableCell, WidthType, BorderStyle, Paragraph, TextRun, AlignmentType } = lib;

  const rows = tableData.rows || [];
  const headerRow = tableData.headerRow !== false;
  const numbering = tableData.numbering !== false;

  const borders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '111827' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '111827' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '111827' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '111827' },
  };

  const tableRows = rows.map((row, ri) => {
    const isHeader = headerRow && ri === 0;
    const dataIndex = headerRow ? ri - 1 : ri;
    const cells = [];

    if (numbering) {
      cells.push(new TableCell({
        children: [new Paragraph({
          children: [new TextRun({
            text: isHeader ? 'No.' : String(dataIndex + 1),
            bold: isHeader,
            size: 20,
          })],
          alignment: AlignmentType.CENTER,
        })],
        borders,
        width: { size: 500, type: WidthType.DXA },
      }));
    }

    row.forEach((cell) => {
      const text = String(cell || '');
      const lines = text.split('\n');
      cells.push(new TableCell({
        children: lines.map((ln) => new Paragraph({
          children: [new TextRun({
            text: ln,
            bold: isHeader,
            size: 20,
          })],
        })),
        borders,
      }));
    });

    return new TableRow({ children: cells });
  });

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function alignToDocx(a, AT) {
  if (a === 'center') return AT.CENTER;
  if (a === 'right')  return AT.RIGHT;
  return AT.LEFT;
}

/* ============================================================
   HTML
   ============================================================ */

async function exportHtmlFile(doc, onProgress) {
  onProgress?.('Menyiapkan HTML…');
  const esc = (s) => String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const sectionsHtml = doc.sections
    .filter((s) => {
      if (s.heading?.trim()) return true;
      if (s.type === 'table') return (s.tableData?.rows || []).length > 0;
      return !!(s.body && s.body.trim());
    })
    .map((s) => {
      const parts = [];
      if (s.heading?.trim()) parts.push(`<h2>${esc(s.heading)}</h2>`);

      if (s.type === 'table' && (s.tableData?.rows || []).length > 0) {
        const rows = s.tableData.rows;
        const headerRow = s.tableData.headerRow !== false;
        const numbering = s.tableData.numbering !== false;
        const rowsHtml = rows.map((row, ri) => {
          const isHeader = headerRow && ri === 0;
          const dataIndex = headerRow ? ri - 1 : ri;
          const cells = [];
          if (numbering) {
            cells.push(`<td style="text-align:center;width:28px;${isHeader ? 'font-weight:700;' : ''}">${isHeader ? 'No.' : dataIndex + 1}</td>`);
          }
          row.forEach((cell) => {
            cells.push(`<td style="${isHeader ? 'font-weight:700;' : ''}">${esc(cell).replace(/\n/g, '<br>') || '&nbsp;'}</td>`);
          });
          return `<tr>${cells.join('')}</tr>`;
        }).join('');
        parts.push(`<table>${rowsHtml}</table>`);
      }

      if (s.type !== 'table' && s.body?.trim()) {
        parts.push(`<p>${esc(s.body).replace(/\n/g, '<br>')}</p>`);
      }

      return `<section>${parts.join('\n')}</section>`;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>${esc(doc.title || 'Dokumen')}</title>
<style>
  body { font-family: ${doc.fontFamily || 'sans-serif'}; max-width: 794px; margin: 40px auto; padding: 40px; color: #111; line-height: ${doc.lineHeight || 1.6}; font-size: ${doc.fontSize || 14}px; }
  h1 { color: ${doc.accent || '#2563eb'}; }
  h2 { color: ${doc.accent || '#2563eb'}; border-bottom: 2px solid ${doc.accent || '#2563eb'}; padding-bottom: 4px; margin-top: 32px; }
  .sub { color: #666; margin-bottom: 12px; }
  .meta { display: flex; justify-content: space-between; color: #888; font-size: 0.85em; border-bottom: 2px solid ${doc.accent || '#2563eb'}; padding-bottom: 16px; margin-bottom: 24px; }
  p { white-space: pre-wrap; }
  table { border-collapse: collapse; width: auto; margin: 8px 0; }
  td { border: 1px solid #111827; padding: 6px 10px; vertical-align: top; }
</style>
</head>
<body>
  <h1>${esc(doc.title)}</h1>
  ${doc.subtitle ? `<div class="sub">${esc(doc.subtitle)}</div>` : ''}
  <div class="meta"><span>${esc(doc.author)}</span><span>${esc(doc.date)}</span></div>
${sectionsHtml}
</body>
</html>`;

  download(html, baseName(doc) + '.html', 'text/html');
}

/* ============================================================
   MD
   ============================================================ */

async function exportMd(doc, onProgress) {
  onProgress?.('Menyiapkan Markdown…');
  let out = '';
  if (doc.title) out += `# ${doc.title}\n\n`;
  if (doc.subtitle) out += `_${doc.subtitle}_\n\n`;
  if (doc.author || doc.date) out += `**${doc.author || ''}**  \n${doc.date || ''}\n\n`;
  out += '---\n\n';

  doc.sections.forEach((s) => {
    if (s.heading?.trim()) out += `## ${s.heading}\n\n`;

    if (s.type === 'table' && (s.tableData?.rows || []).length > 0) {
      const rows = s.tableData.rows;
      const headerRow = s.tableData.headerRow !== false;
      const numbering = s.tableData.numbering !== false;
      const headerCells = [];
      if (numbering) headerCells.push('No.');
      const colCount = (rows[0] || []).length;
      for (let i = 0; i < colCount; i++) headerCells.push(`Kolom ${i + 1}`);
      out += '| ' + headerCells.join(' | ') + ' |\n';
      out += '|' + headerCells.map(() => '---').join('|') + '|\n';
      rows.forEach((row, ri) => {
        if (headerRow && ri === 0) return;
        const cells = [];
        if (numbering) cells.push(String(ri - (headerRow ? 1 : 0) + 1));
        row.forEach((c) => cells.push((c || '').replace(/\n/g, ' ')));
        out += '| ' + cells.join(' | ') + ' |\n';
      });
      out += '\n';
      return;
    }

    if (s.body?.trim()) out += s.body + '\n\n';
  });

  download(out, baseName(doc) + '.md', 'text/markdown');
}

/* ============================================================
   TXT
   ============================================================ */

async function exportTxt(doc, onProgress) {
  onProgress?.('Menyiapkan teks…');
  let out = '';
  if (doc.title) out += `${doc.title.toUpperCase()}\n\n`;
  if (doc.subtitle) out += `${doc.subtitle}\n\n`;
  if (doc.author) out += `${doc.author}\n`;
  if (doc.date) out += `${doc.date}\n`;
  out += '\n' + '='.repeat(50) + '\n\n';

  doc.sections.forEach((s) => {
    if (s.heading?.trim()) out += `${s.heading}\n${'-'.repeat(s.heading.length)}\n\n`;

    if (s.type === 'table' && (s.tableData?.rows || []).length > 0) {
      const rows = s.tableData.rows;
      const numbering = s.tableData.numbering !== false;
      rows.forEach((row, ri) => {
        const cells = [];
        if (numbering) cells.push(String(ri + 1) + '.');
        row.forEach((c) => cells.push(c || ''));
        out += cells.join('  |  ') + '\n';
      });
      out += '\n';
      return;
    }

    if (s.body?.trim()) out += s.body + '\n\n';
  });

  download(out, baseName(doc) + '.txt', 'text/plain');
}

/* ============================================================
   JSON
   ============================================================ */

async function exportJsonFile(doc, onProgress) {
  onProgress?.('Menyiapkan JSON…');
  download(JSON.stringify(doc, null, 2), baseName(doc) + '.json', 'application/json');
}
