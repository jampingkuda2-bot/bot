'use client';

import { useState, useEffect } from 'react';
import {
  FileText, Download, Upload, Moon, Sun, Plus, Trash2,
  ChevronUp, ChevronDown, Palette, Layout as LayoutIcon,
  ZoomIn, ZoomOut, RotateCcw, Copy, Check,
  AlignLeft, AlignCenter, AlignRight, FileJson, Image as ImageIcon,
  FileType, Eye, ChevronsUpDown,
} from 'lucide-react';

/* ---------- KONSTANTA ---------- */

export const PAGE_SIZES = {
  A4:     { label: 'A4',     w: 794,  h: 1123, mmW: 210,   mmH: 297   },
  Letter: { label: 'Letter', w: 816,  h: 1056, mmW: 215.9, mmH: 279.4 },
  Legal:  { label: 'Legal',  w: 816,  h: 1344, mmW: 215.9, mmH: 355.6 },
};

export const FONTS = [
  { label: 'Sans',  value: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif" },
  { label: 'Inter', value: "'Inter', ui-sans-serif, system-ui, sans-serif" },
  { label: 'Serif', value: "Georgia, 'Times New Roman', Times, serif" },
  { label: 'Garamond', value: "Garamond, 'Apple Garamond', 'Times New Roman', serif" },
  { label: 'Mono',  value: "'JetBrains Mono', 'Courier New', ui-monospace, monospace" },
  { label: 'Slab',  value: "'Rockwell', 'Courier New', 'Courier', monospace" },
];

export const TEMPLATES = [
  { id: 'modern',  name: 'Modern',  accent: '#2563eb', font: 0, heading: 'line',  lineHeight: 1.65 },
  { id: 'minimal', name: 'Minimal', accent: '#0f172a', font: 0, heading: 'plain', lineHeight: 1.75 },
  { id: 'elegant', name: 'Elegant', accent: '#7c3aed', font: 2, heading: 'line',  lineHeight: 1.7  },
  { id: 'bold',    name: 'Bold',    accent: '#dc2626', font: 0, heading: 'fill',  lineHeight: 1.6  },
  { id: 'tech',    name: 'Tech',    accent: '#0891b2', font: 4, heading: 'line',  lineHeight: 1.7  },
  { id: 'classic', name: 'Classic', accent: '#78350f', font: 3, heading: 'fill',  lineHeight: 1.75 },
];

export const ACCENT_PRESETS = ['#2563eb','#dc2626','#059669','#7c3aed','#ea580c','#0891b2','#0f172a','#be185d'];

export const STORAGE_KEY = 'pdfstudio.doc.v2';
export const THEME_KEY   = 'pdfstudio.theme';

/* ---------- DOKUMEN AWAL ---------- */

export const buildInitialDoc = () => ({
  title: 'Judul Dokumen Anda',
  subtitle: 'Subjudul atau deskripsi singkat yang menjelaskan isi dokumen',
  author: 'Nama Penulis',
  date: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
  logo: null,
  showCover: false,
  template: 'modern',
  accent: '#2563eb',
  fontFamily: FONTS[0].value,
  fontSize: 14,
  lineHeight: 1.65,
  headingStyle: 'line',
  pageSize: 'A4',
  orientation: 'portrait',
  margin: 64,
  headerText: '',
  footerText: '',
  showPageNumbers: true,
  watermark: '',
  sections: [
    { heading: 'Pendahuluan', body: 'Selamat datang di PDF Studio. Ubah semua teks, warna, dan tata letak melalui panel di sebelah kiri.', align: 'left', breakBefore: false },
    { heading: 'Fitur Utama', body: '• Editor lengkap\n• Export PDF multi-halaman\n• Nomor halaman otomatis\n• Autosave di browser', align: 'left', breakBefore: false },
    { heading: 'Catatan', body: 'Aktifkan "Halaman baru" pada bagian tertentu untuk memulai halaman baru di PDF.', align: 'left', breakBefore: false },
  ],
});

/* ---------- UTIL ---------- */

export const loadLocal = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? { ...fallback, ...JSON.parse(v) } : fallback;
  } catch { return fallback; }
};

export const downloadBlob = (data, filename, type = 'application/json') => {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export const slug = (s) => (s || 'dokumen').replace(/[^\w\-]+/g, '_').slice(0, 60) || 'dokumen';

/* ---------- EXPORT PDF ---------- */

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

  onProgress?.('Merender halaman…');
  const canvas = await html2canvas(el, {
    scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
    windowWidth: el.scrollWidth, windowHeight: el.scrollHeight,
  });

  const pdf = new jsPDF({ orientation: doc.orientation, unit: 'mm', format: [pageWmm, pageHmm], compress: true });
  const imgW = pageWmm;
  const imgH = (canvas.height * imgW) / canvas.width;
  const usableH = pageHmm - (doc.showPageNumbers ? 8 : 0);

  onProgress?.('Menyusun PDF…');
  if (imgH <= usableH) {
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, imgW, imgH);
  } else {
    const pageHeightPx = Math.floor((usableH / imgH) * canvas.height);
    let y = 0, pageIdx = 0;
    while (y < canvas.height) {
      const sliceH = Math.min(pageHeightPx, canvas.height - y);
      const c = document.createElement('canvas');
      c.width = canvas.width; c.height = sliceH;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      if (pageIdx > 0) pdf.addPage();
      pdf.addImage(c.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, imgW, (sliceH * imgW) / canvas.width);
      y += sliceH; pageIdx++;
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
