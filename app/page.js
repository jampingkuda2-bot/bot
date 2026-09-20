'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  FileText, Download, Upload, Moon, Sun, Plus, Trash2,
  ChevronUp, ChevronDown, Type, Palette, Layout as LayoutIcon,
  ZoomIn, ZoomOut, RotateCcw, Copy, Check, Sparkles,
  AlignLeft, AlignCenter, AlignRight, FileJson, Image as ImageIcon,
  X, Droplet, FileType, Grid3x3, Hash, Save, Eye, ChevronsUpDown,
} from 'lucide-react';

/* ============================================================
   KONSTANTA
   ============================================================ */

const PAGE_SIZES = {
  A4:     { label: 'A4',     w: 794,  h: 1123, mmW: 210,   mmH: 297   },
  Letter: { label: 'Letter', w: 816,  h: 1056, mmW: 215.9, mmH: 279.4 },
  Legal:  { label: 'Legal',  w: 816,  h: 1344, mmW: 215.9, mmH: 355.6 },
};

const FONTS = [
  { label: 'Sans',  value: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif", group: 'Default' },
  { label: 'Inter', value: "'Inter', ui-sans-serif, system-ui, sans-serif",                                  group: 'Default' },
  { label: 'Serif', value: "Georgia, 'Times New Roman', Times, serif",                                       group: 'Serif'   },
  { label: 'Garamond', value: "Garamond, 'Apple Garamond', 'Times New Roman', serif",                         group: 'Serif'   },
  { label: 'Mono',  value: "'JetBrains Mono', 'Courier New', ui-monospace, monospace",                        group: 'Mono'    },
  { label: 'Slab',  value: "'Rockwell', 'Courier New', 'Courier', monospace",                                 group: 'Mono'    },
];

const TEMPLATES = [
  { id: 'modern',   name: 'Modern',   accent: '#2563eb', font: 0, heading: 'line',  layout: 'boxed', lineHeight: 1.65 },
  { id: 'minimal',  name: 'Minimal',  accent: '#0f172a', font: 0, heading: 'plain', layout: 'plain', lineHeight: 1.75 },
  { id: 'elegant',  name: 'Elegant',  accent: '#7c3aed', font: 2, heading: 'line',  layout: 'plain', lineHeight: 1.7  },
  { id: 'bold',     name: 'Bold',     accent: '#dc2626', font: 0, heading: 'fill',  layout: 'boxed', lineHeight: 1.6  },
  { id: 'tech',     name: 'Tech',     accent: '#0891b2', font: 4, heading: 'line',  layout: 'boxed', lineHeight: 1.7  },
  { id: 'classic',  name: 'Classic',  accent: '#78350f', font: 3, heading: 'fill',  layout: 'plain', lineHeight: 1.75 },
];

const ACCENT_PRESETS = ['#2563eb','#dc2626','#059669','#7c3aed','#ea580c','#0891b2','#0f172a','#be185d'];

const STORAGE_KEY = 'pdfstudio.doc.v2';
const THEME_KEY   = 'pdfstudio.theme';

/* ============================================================
   DOKUMEN AWAL
   ============================================================ */

const buildInitialDoc = () => ({
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
  headingStyle: 'line', // 'line' | 'plain' | 'fill'

  pageSize: 'A4',
  orientation: 'portrait',
  margin: 64,
  headerText: '',
  footerText: '',
  showPageNumbers: true,
  watermark: '',

  sections: [
    {
      heading: 'Pendahuluan',
      body: 'Selamat datang di PDF Studio. Ubah semua teks, warna, dan tata letak melalui panel di sebelah kiri. Semua perubahan langsung tampil di preview.',
      align: 'left',
      breakBefore: false,
    },
    {
      heading: 'Fitur Utama',
      body: '• Editor lengkap dengan banyak opsi tata letak\n• Export PDF A4/Letter/Legal multi-halaman\n• Nomor halaman otomatis\n• Autosave di browser\n• Import & export project dalam format JSON',
      align: 'left',
      breakBefore: false,
    },
    {
      heading: 'Catatan',
      body: 'Untuk menambah halaman baru, aktifkan "Mulai di halaman baru" pada bagian yang diinginkan.',
      align: 'left',
      breakBefore: false,
    },
  ],
});

/* ============================================================
   UTIL
   ============================================================ */

const loadLocal = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? { ...fallback, ...JSON.parse(v) } : fallback;
  } catch { return fallback; }
};

const downloadBlob = (data, filename, type = 'application/json') => {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const slug = (s) => (s || 'dokumen').replace(/[^\w\-]+/g, '_').slice(0, 60) || 'dokumen';

/* ============================================================
   EXPORT PDF
   ============================================================ */

async function exportPdf(el, doc, onProgress) {
  onProgress?.('Menyiapkan…');
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const page = PAGE_SIZES[doc.pageSize];
  const isLandscape = doc.orientation === 'landscape';
  const pageWmm = isLandscape ? page.mmH : page.mmW;
  const pageHmm = isLandscape ? page.mmW : page.mmH;

  onProgress?.('Merender halaman…');
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
  const reserveBottom = doc.showPageNumbers ? 8 : 0;
  const usableH = pageHmm - reserveBottom;

  onProgress?.('Menyusun PDF…');
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
        'JPEG', 0, 0, imgW, (sliceH * imgW) / canvas.width
      );
      y += sliceH;
      pageIdx++;
    }
  }

  // Nomor halaman
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

/* ============================================================
   KOMPONEN UTAMA
   ============================================================ */

export default function Home() {
  const [doc, setDoc] = useState(buildInitialDoc);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('content');
  const [dark, setDark] = useState(false);
  const [zoom, setZoom] = useState(0.85);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [copied, setCopied] = useState(false);
  const previewRef = useRef(null);
  const importRef = useRef(null);

  /* -------- Init: load tersimpan + theme -------- */
  useEffect(() => {
    setDoc(loadLocal(STORAGE_KEY, buildInitialDoc()));
    setDark(document.documentElement.classList.contains('dark'));
    setReady(true);
  }, []);

  /* -------- Autosave -------- */
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(doc)); } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [doc, ready]);

  /* -------- Theme -------- */
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem(THEME_KEY, next ? 'dark' : 'light'); } catch {}
  };

  /* -------- Helpers -------- */
  const update = useCallback((patch) => setDoc((d) => ({ ...d, ...patch })), []);

  const applyTemplate = (t) => {
    update({
      template: t.id,
      accent: t.accent,
      fontFamily: FONTS[t.font].value,
      headingStyle: t.heading,
      lineHeight: t.lineHeight,
    });
  };

  const page = PAGE_SIZES[doc.pageSize];
  const isLandscape = doc.orientation === 'landscape';
  const pageW = isLandscape ? page.h : page.w;
  const pageH = isLandscape ? page.w : page.h;

  /* -------- Section ops -------- */
  const updateSection = (i, patch) =>
    setDoc((d) => {
      const s = d.sections.slice();
      s[i] = { ...s[i], ...patch };
      return { ...d, sections: s };
    });

  const addSection = () =>
    setDoc((d) => ({
      ...d,
      sections: [...d.sections, { heading: 'Bagian Baru', body: '', align: 'left', breakBefore: false }],
    }));

  const removeSection = (i) =>
    setDoc((d) => ({ ...d, sections: d.sections.filter((_, idx) => idx !== i) }));

  const moveSection = (i, dir) =>
    setDoc((d) => {
      const s = d.sections.slice();
      const j = i + dir;
      if (j < 0 || j >= s.length) return d;
      [s[i], s[j]] = [s[j], s[i]];
      return { ...d, sections: s };
    });

  const duplicateSection = (i) =>
    setDoc((d) => {
      const s = d.sections.slice();
      s.splice(i + 1, 0, { ...s[i] });
      return { ...d, sections: s };
    });

  /* -------- Logo upload -------- */
  const onLogoChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => update({ logo: reader.result });
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  /* -------- Export / Import JSON -------- */
  const exportJson = () => {
    downloadBlob(JSON.stringify(doc, null, 2), `${slug(doc.title)}.json`);
  };

  const importJson = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        setDoc({ ...buildInitialDoc(), ...parsed });
      } catch {
        alert('File JSON tidak valid.');
      }
    };
    reader.readAsText(f);
    e.target.value = '';
  };

  /* -------- Export PDF -------- */
  const handleExport = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    setProgress('Memulai…');
    try {
      await exportPdf(previewRef.current, doc, setProgress);
    } catch (e) {
      console.error(e);
      alert('Gagal membuat PDF: ' + e.message);
    } finally {
      setExporting(false);
      setProgress('');
    }
  };

  const resetDoc = () => {
    if (!confirm('Reset semua perubahan ke contoh awal?')) return;
    setDoc(buildInitialDoc());
  };

  /* -------- Copy JSON ke clipboard -------- */
  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-neutral-400">
        Memuat…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        doc={doc}
        dark={dark}
        exporting={exporting}
        progress={progress}
        onToggleTheme={toggleTheme}
        onExport={handleExport}
        onReset={resetDoc}
        onExportJson={exportJson}
        onImportJson={() => importRef.current?.click()}
      />
      <input
        ref={importRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={importJson}
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[400px_1fr] min-h-0">
        {/* ============ SIDEBAR ============ */}
        <aside className="border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col min-h-0 lg:max-h-[calc(100vh-57px)]">
          <Tabs tab={tab} setTab={setTab} />

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {tab === 'content' && (
              <ContentTab
                doc={doc}
                update={update}
                updateSection={updateSection}
                addSection={addSection}
                removeSection={removeSection}
                moveSection={moveSection}
                duplicateSection={duplicateSection}
                onLogoChange={onLogoChange}
              />
            )}
            {tab === 'style' && <StyleTab doc={doc} update={update} applyTemplate={applyTemplate} />}
            {tab === 'page' && <PageTab doc={doc} update={update} />}
            {tab === 'data' && (
              <DataTab
                doc={doc}
                onExportJson={exportJson}
                onImportJson={() => importRef.current?.click()}
                onCopyJson={copyJson}
                copied={copied}
                onReset={resetDoc}
              />
            )}
          </div>
        </aside>

        {/* ============ PREVIEW ============ */}
        <PreviewPanel
          doc={doc}
          pageW={pageW}
          pageH={pageH}
          zoom={zoom}
          setZoom={setZoom}
          previewRef={previewRef}
        />
      </div>
    </div>
  );
}

/* ============================================================
   TOP BAR
   ============================================================ */

function TopBar({ doc, dark, exporting, progress, onToggleTheme, onExport, onReset, onExportJson, onImportJson }) {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur">
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center text-white shadow-sm">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight truncate">PDF Studio</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight truncate">
              {doc.title || 'Tanpa judul'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <IconBtn title="Import JSON" onClick={onImportJson}><Upload className="w-4 h-4" /></IconBtn>
          <IconBtn title="Export JSON" onClick={onExportJson}><FileJson className="w-4 h-4" /></IconBtn>
          <IconBtn title="Reset" onClick={onReset}><RotateCcw className="w-4 h-4" /></IconBtn>
          <IconBtn title="Tema" onClick={onToggleTheme}>
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </IconBtn>

          <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800 mx-1" />

          <button
            onClick={onExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:opacity-90 active:scale-[0.98] transition disabled:opacity-60"
          >
            {exporting ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                <span className="hidden sm:inline">{progress || 'Memproses…'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function IconBtn({ children, onClick, title, active }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-2 rounded-lg transition hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
        active ? 'bg-neutral-100 dark:bg-neutral-800' : ''
      } text-neutral-600 dark:text-neutral-300`}
    >
      {children}
    </button>
  );
}

/* ============================================================
   TABS
   ============================================================ */

const TABS = [
  { id: 'content', label: 'Konten',  icon: FileType },
  { id: 'style',   label: 'Gaya',    icon: Palette },
  { id: 'page',    label: 'Halaman', icon: LayoutIcon },
  { id: 'data',    label: 'Data',    icon: FileJson },
];

function Tabs({ tab, setTab }) {
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 grid grid-cols-4">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition relative ${
              active
                ? 'text-neutral-900 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {t.label}
            {active && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-t bg-neutral-900 dark:bg-white" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   TAB: KONTEN
   ============================================================ */

function ContentTab({ doc, update, updateSection, addSection, removeSection, moveSection, duplicateSection, onLogoChange }) {
  return (
    <>
      <Group title="Informasi Dokumen">
        <Field label="Judul">
          <TextInput value={doc.title} onChange={(v) => update({ title: v })} placeholder="Judul dokumen" />
        </Field>
        <Field label="Subjudul">
          <TextInput value={doc.subtitle} onChange={(v) => update({ subtitle: v })} placeholder="Subjudul" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Penulis">
            <TextInput value={doc.author} onChange={(v) => update({ author: v })} />
          </Field>
          <Field label="Tanggal">
            <TextInput value={doc.date} onChange={(v) => update({ date: v })} />
          </Field>
        </div>
      </Group>

      <Group title="Logo & Cover">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 grid place-items-center overflow-hidden bg-neutral-50 dark:bg-neutral-800/50">
            {doc.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={doc.logo} alt="logo" className="w-full h-full object-contain" />
            ) : (
              <ImageIcon className="w-5 h-5 text-neutral-400" />
            )}
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800">
              <Upload className="w-3.5 h-3.5" />
              Upload logo
              <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
   
