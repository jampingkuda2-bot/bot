import { PAGE_SIZES, slug } from './constants';

const PAGE_NUMBER_RESERVE_MM = 8;

export async function exportPdf(el, doc, onProgress) {
  onProgress?.('Menyiapkan…');
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const page = PAGE_SIZES[doc.pageSize];
  const isL = doc.orientation === 'landscape';
  const pageWmm = isL ? page.mmH : page.mmW;
  const pageHmm = isL ? page.mmW : page.mmH;

  onProgress?.('Merender…');
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  });

  const pdf = new jsPDF({
    orientation: doc.orientation,
    unit: 'mm',
    format: [pageWmm, pageHmm],
    compress: true,
  });

  const imgW = pageWmm;
  const imgH = (canvas.height * imgW) / canvas.width;

  const reserveMm = doc.showPageNumbers ? PAGE_NUMBER_RESERVE_MM : 0;
  const usableH = pageHmm - reserveMm;
  const contentMm = Math.max(1, imgH - reserveMm);

  const pages = Math.max(1, Math.ceil(contentMm / usableH));

  const pxPerMm = canvas.height / imgH;
  const contentPx = Math.max(1, canvas.height - reserveMm * pxPerMm);

  onProgress?.('Menyusun…');
  if (pages === 1) {
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, imgW, contentMm);
  } else {
    const pageHeightPx = usableH * pxPerMm;
    let y = 0;
    for (let i = 0; i < pages; i++) {
      const remaining = contentPx - y;
      if (remaining <= 0) break;

      const slicePx = Math.min(Math.ceil(pageHeightPx), remaining);
      const c = document.createElement('canvas');
      c.width = canvas.width;
      c.height = slicePx;

      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(canvas, 0, y, canvas.width, slicePx, 0, 0, canvas.width, slicePx);

      const sliceMm = (slicePx * imgW) / canvas.width;
      if (i > 0) pdf.addPage();
      pdf.addImage(c.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, imgW, sliceMm);

      y += slicePx;
    }
  }

  if (doc.showPageNumbers) {
    const total = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(150);
      pdf.text(`${i} / ${total}`, pageWmm / 2, pageHmm - 4, { align: 'center' });
    }
  }

  onProgress?.('Menyimpan…');
  pdf.save(`${slug(doc.title)}.pdf`);
}
