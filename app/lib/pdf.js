import { PAGE_SIZES, slug } from './constants';

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
  const usableH = pageHmm - (doc.showPageNumbers ? 8 : 0);

  onProgress?.('Menyusun…');
  if (imgH <= usableH) {
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, imgW, imgH);
  } else {
    const pageHeightPx = Math.floor((usableH / imgH) * canvas.height);
    let y = 0, pageIdx = 0;
    while (y < canvas.height) {
      const sliceH = Math.min(pageHeightPx, canvas.height - y);
      const c = document.createElement('canvas');
      c.width = canvas.width;
      c.height = sliceH;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      if (pageIdx > 0) pdf.addPage();
      pdf.addImage(
        c.toDataURL('image/jpeg', 0.95),
        'JPEG', 0, 0, imgW,
        (sliceH * imgW) / canvas.width
      );
      y += sliceH;
      pageIdx++;
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
