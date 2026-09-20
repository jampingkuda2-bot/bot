export const PAGE_SIZES = {
  A4:     { label: 'A4',     w: 794,  h: 1123, mmW: 210,   mmH: 297   },
  Letter: { label: 'Letter', w: 816,  h: 1056, mmW: 215.9, mmH: 279.4 },
  Legal:  { label: 'Legal',  w: 816,  h: 1344, mmW: 215.9, mmH: 355.6 },
};

export const FONTS = [
  { label: 'Sans',  value: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif" },
  { label: 'Inter', value: "'Inter', ui-sans-serif, system-ui, sans-serif" },
  { label: 'Serif', value: "Georgia, 'Times New Roman', Times, serif" },
  { label: 'Mono',  value: "'JetBrains Mono', 'Courier New', ui-monospace, monospace" },
];

export const TEMPLATES = [
  { id: 'modern',  name: 'Modern',  accent: '#2563eb', font: 0, heading: 'line',  lineHeight: 1.65, plain: false },
  { id: 'minimal', name: 'Minimal', accent: '#0f172a', font: 0, heading: 'plain', lineHeight: 1.75, plain: false },
  { id: 'elegant', name: 'Elegant', accent: '#7c3aed', font: 2, heading: 'line',  lineHeight: 1.7,  plain: false },
  { id: 'bold',    name: 'Bold',    accent: '#dc2626', font: 0, heading: 'fill',  lineHeight: 1.6,  plain: false },
  { id: 'plain',   name: 'Polos',   accent: '#111827', font: 0, heading: 'plain', lineHeight: 1.7,  plain: true  },
];

export const ACCENT_PRESETS = [
  '#2563eb', '#dc2626', '#059669', '#7c3aed', '#ea580c', '#0891b2', '#0f172a', '#be185d',
];

export const STORAGE_KEY = 'pdfstudio.doc.v2';
export const THEME_KEY = 'pdfstudio.theme';

export const buildInitialDoc = () => ({
  title: 'Judul Dokumen Anda',
  subtitle: 'Subjudul atau deskripsi singkat',
  author: 'Nama Penulis',
  date: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
  logo: null,
  showCover: false,
  template: 'modern',
  plain: false,
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
  titleAlign: 'left',
  titleOffsetX: 0,
  titleOffsetY: 0,
  titleScale: 1,
  subtitleGap: 8,
  authorAlign: 'split',
  authorOffsetX: 0,
  authorOffsetY: 0,
  authorFontFamily: '',
  authorFontSize: 0.82,
  logoOffsetX: 0,
  logoOffsetY: 0,
  logoSize: 56,
  locked: false,
  sections: [
    { heading: 'Pendahuluan', body: 'Selamat datang di PDF Studio. Ubah semua teks di panel kiri.', align: 'left', breakBefore: false },
    { heading: 'Fitur Utama', body: '• Editor lengkap\n• Export PDF multi-halaman\n• Nomor halaman otomatis', align: 'left', breakBefore: false },
  ],
});

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
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const slug = (s) =>
  (s || 'dokumen').replace(/[^\w\-]+/g, '_').slice(0, 60) || 'dokumen';
