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
/* ============================================================
   TOP BAR & TABS
   ============================================================ */

export function TopBar({ doc, dark, exporting, progress, onToggleTheme, onExport, onReset, onExportJson, onImportJson }) {
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

export function IconBtn({ children, onClick, title, active }) {
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

const TABS = [
  { id: 'content', label: 'Konten',  icon: FileType },
  { id: 'style',   label: 'Gaya',    icon: Palette },
  { id: 'page',    label: 'Halaman', icon: LayoutIcon },
  { id: 'data',    label: 'Data',    icon: FileJson },
];

export function Tabs({ tab, setTab }) {
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
              active ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {t.label}
            {active && <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-t bg-neutral-900 dark:bg-white" />}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   TAB: KONTEN
   ============================================================ */

export function ContentTab({ doc, update, updateSection, addSection, removeSection, moveSection, duplicateSection, onLogoChange }) {
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
          <Field label="Penulis"><TextInput value={doc.author} onChange={(v) => update({ author: v })} /></Field>
          <Field label="Tanggal"><TextInput value={doc.date} onChange={(v) => update({ date: v })} /></Field>
        </div>
      </Group>

      <Group title="Logo & Cover">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 grid place-items-center overflow-hidden bg-neutral-50 dark:bg-neutral-800/50">
            {doc.logo ? (
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
            </label>
            {doc.logo && (
              <button onClick={() => update({ logo: null })} className="block text-[11px] text-red-600 hover:underline">
                Hapus logo
              </button>
            )}
          </div>
        </div>
        <Toggle label="Tampilkan cover page" hint="Halaman pertama khusus judul" checked={doc.showCover} onChange={(v) => update({ showCover: v })} />
      </Group>

      <Group title={`Bagian (${doc.sections.length})`}>
        <div className="space-y-3">
          {doc.sections.map((s, i) => (
            <SectionCard
              key={i}
              index={i}
              section={s}
              onChange={(patch) => updateSection(i, patch)}
              onRemove={() => removeSection(i)}
              onMoveUp={() => moveSection(i, -1)}
              onMoveDown={() => moveSection(i, 1)}
              onDuplicate={() => duplicateSection(i)}
              canMoveUp={i > 0}
              canMoveDown={i < doc.sections.length - 1}
            />
          ))}
          <button
            onClick={addSection}
            className="w-full py-2.5 text-sm rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-neutral-500 transition"
          >
            <Plus className="w-4 h-4 inline -mt-0.5 mr-1" />
            Tambah Bagian
          </button>
        </div>
      </Group>
    </>
  );
}

function SectionCard({ index, section, onChange, onRemove, onMoveUp, onMoveDown, onDuplicate, canMoveUp, canMoveDown }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 flex-1 text-left px-1 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <ChevronUp className={`w-3.5 h-3.5 text-neutral-400 transition ${open ? '' : 'rotate-180'}`} />
          <span className="text-xs font-medium truncate">{index + 1}. {section.heading || '(tanpa judul)'}</span>
        </button>
        <div className="flex items-center gap-0.5">
          <MiniBtn onClick={onMoveUp} disabled={!canMoveUp} title="Naik"><ChevronUp className="w-3.5 h-3.5" /></MiniBtn>
          <MiniBtn onClick={onMoveDown} disabled={!canMoveDown} title="Turun"><ChevronDown className="w-3.5 h-3.5" /></MiniBtn>
          <MiniBtn onClick={onDuplicate} title="Duplikat"><Copy className="w-3.5 h-3.5" /></MiniBtn>
          <MiniBtn onClick={onRemove} title="Hapus" danger><Trash2 className="w-3.5 h-3.5" /></MiniBtn>
        </div>
      </div>
      {open && (
        <div className="px-3 pb-3 space-y-2.5">
          <TextInput value={section.heading} onChange={(v) => onChange({ heading: v })} placeholder="Judul bagian" />
          <textarea
            value={section.body}
            onChange={(e) => onChange({ body: e.target.value })}
            placeholder="Isi bagian… (baris baru didukung)"
            rows={5}
            className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-y"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
              {[
                { v: 'left',   Icon: AlignLeft },
                { v: 'center', Icon: AlignCenter },
                { v: 'right',  Icon: AlignRight },
              ].map(({ v, Icon }) => (
                <button
                  key={v}
                  onClick={() => onChange({ align: v })}
                  className={`p-1.5 rounded-md transition ${
                    section.align === v
                      ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title={v}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
              <input type="checkbox" checked={!!section.breakBefore} onChange={(e) => onChange({ breakBefore: e.target.checked })} className="accent-blue-600" />
              Halaman baru
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniBtn({ children, onClick, disabled, title, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition disabled:opacity-30 disabled:cursor-not-allowed ${
        danger ? 'hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
/* ============================================================
   TAB: GAYA
   ============================================================ */

export function StyleTab({ doc, update }) {
  const applyTemplate = (t) => update({
    template: t.id,
    accent: t.accent,
    fontFamily: FONTS[t.font].value,
    headingStyle: t.heading,
    lineHeight: t.lineHeight,
  });

  return (
    <>
      <Group title="Template">
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map((t) => {
            const active = doc.template === t.id;
            return (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className={`rounded-xl border p-2.5 text-left transition ${
                  active ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30' : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="w-full aspect-[3/4] rounded-md mb-1.5 overflow-hidden bg-white border border-neutral-100">
                  <div style={{ height: 4, background: t.accent }} />
                  <div className="p-1.5 space-y-1">
                    <div style={{ height: 3, width: '70%', background: t.accent, borderRadius: 2 }} />
                    <div className="h-1 rounded-full bg-neutral-200" style={{ width: '100%' }} />
                    <div className="h-1 rounded-full bg-neutral-200" style={{ width: '85%' }} />
                    <div style={{ height: 3, width: '55%', background: t.accent, borderRadius: 2, marginTop: 4 }} />
                    <div className="h-1 rounded-full bg-neutral-200" style={{ width: '95%' }} />
                  </div>
                </div>
                <div className="text-[11px] font-medium text-center">{t.name}</div>
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Warna Aksen">
        <div className="flex flex-wrap items-center gap-2">
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => update({ accent: c })}
              className={`w-8 h-8 rounded-full transition ${
                doc.accent === c
                  ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 ring-neutral-900 dark:ring-white'
                  : 'ring-1 ring-inset ring-black/10'
              }`}
              style={{ background: c }}
            />
          ))}
          <input type="color" value={doc.accent} onChange={(e) => update({ accent: e.target.value })} className="w-8 h-8 rounded-full" />
          <span className="text-[11px] font-mono text-neutral-500">{doc.accent}</span>
        </div>
      </Group>

      <Group title="Tipografi">
        <Field label="Font">
          <select value={doc.fontFamily} onChange={(e) => update({ fontFamily: e.target.value })} className={selectCls}>
            {FONTS.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
          </select>
        </Field>
        <Field label={`Ukuran font — ${doc.fontSize}px`}>
          <input type="range" min={11} max={22} step={1} value={doc.fontSize} onChange={(e) => update({ fontSize: Number(e.target.value) })} className="w-full" />
        </Field>
        <Field label={`Line height — ${doc.lineHeight.toFixed(2)}`}>
          <input type="range" min={1.3} max={2.2} step={0.05} value={doc.lineHeight} onChange={(e) => update({ lineHeight: Number(e.target.value) })} className="w-full" />
        </Field>
      </Group>

      <Group title="Gaya Heading">
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: 'line',  label: 'Line' },
            { v: 'plain', label: 'Plain' },
            { v: 'fill',  label: 'Fill' },
          ].map((o) => (
            <button
              key={o.v}
              onClick={() => update({ headingStyle: o.v })}
              className={`rounded-lg border py-3 text-xs font-medium transition ${
                doc.headingStyle === o.v
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
              }`}
            >
              <HeadingPreview style={o.v} color={doc.accent} />
              <div className="mt-1.5">{o.label}</div>
            </button>
          ))}
        </div>
      </Group>
    </>
  );
}

function HeadingPreview({ style: s, color }) {
  if (s === 'fill') return <div className="mx-auto w-10 h-2.5 rounded-sm" style={{ background: color }} />;
  if (s === 'line') return (
    <div className="mx-auto w-10">
      <div className="h-1.5 rounded-sm" style={{ background: color }} />
      <div className="h-0.5 mt-0.5" style={{ background: color, opacity: 0.35 }} />
    </div>
  );
  return <div className="mx-auto w-10 h-1.5 rounded-sm" style={{ background: color }} />;
}

/* ============================================================
   TAB: HALAMAN
   ============================================================ */

export function PageTab({ doc, update }) {
  const page = PAGE_SIZES[doc.pageSize];
  return (
    <>
      <Group title="Ukuran & Orientasi">
        <Field label="Ukuran kertas">
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(PAGE_SIZES).map(([k, v]) => (
              <button
                key={k}
                onClick={() => update({ pageSize: k })}
                className={`py-2.5 rounded-lg border text-xs font-medium transition ${
                  doc.pageSize === k
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1.5">{page.mmW} × {page.mmH} mm</div>
        </Field>
        <Field label="Orientasi">
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: 'portrait',  label: 'Portrait' },
              { v: 'landscape', label: 'Landscape' },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => update({ orientation: o.v })}
                className={`py-2.5 rounded-lg border text-xs font-medium transition flex items-center justify-center gap-2 ${
                  doc.orientation === o.v
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                }`}
              >
                <div className={`border-2 border-current rounded-sm ${o.v === 'portrait' ? 'w-2.5 h-3.5' : 'w-3.5 h-2.5'}`} />
                {o.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label={`Margin — ${doc.margin}px`}>
          <input type="range" min={24} max={120} step={4} value={doc.margin} onChange={(e) => update({ margin: Number(e.target.value) })} className="w-full" />
        </Field>
      </Group>

      <Group title="Header & Footer">
        <Field label="Teks header (kiri atas)">
          <TextInput value={doc.headerText} onChange={(v) => update({ headerText: v })} placeholder="cth. Laporan Internal" />
        </Field>
        <Field label="Teks footer">
          <TextInput value={doc.footerText} onChange={(v) => update({ footerText: v })} placeholder="cth. © 2025 Nama Perusahaan" />
        </Field>
        <Toggle label="Nomor halaman" hint="Ditambahkan otomatis di bagian bawah setiap halaman" checked={doc.showPageNumbers} onChange={(v) => update({ showPageNumbers: v })} />
      </Group>

      <Group title="Watermark">
        <Field label="Teks watermark (diagonal)">
          <TextInput value={doc.watermark} onChange={(v) => update({ watermark: v })} placeholder="cth. RAHASIA" />
        </Field>
        <p className="text-[11px] text-neutral-500">Kosongkan untuk menonaktifkan watermark.</p>
      </Group>
    </>
  );
}

/* ============================================================
   TAB: DATA
   ============================================================ */

export function DataTab({ doc, onExportJson, onImportJson, onCopyJson, copied, onReset }) {
  return (
    <>
      <Group title="Project">
        <div className="grid grid-cols-2 gap-2">
          <ActionBtn icon={Download} onClick={onExportJson} label="Export JSON" />
          <ActionBtn icon={Upload}   onClick={onImportJson} label="Import JSON" />
        </div>
        <ActionBtn icon={copied ? Check : Copy} onClick={onCopyJson} label={copied ? 'Tersalin!' : 'Copy JSON ke clipboard'} full />
      </Group>

      <Group title="Statistik">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Stat label="Bagian" value={doc.sections.length} />
          <Stat label="Ukuran" value={doc.pageSize} />
          <Stat label="Orientasi" value={doc.orientation === 'portrait' ? 'Portrait' : 'Landscape'} />
          <Stat label="Nomor halaman" value={doc.showPageNumbers ? 'Aktif' : 'Nonaktif'} />
        </div>
      </Group>

      <Group title="Reset">
        <button
          onClick={onReset}
          className="w-full py-2.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition"
        >
          Reset ke contoh awal
        </button>
        <p className="text-[11px] text-neutral-500">Semua perubahanmu tersimpan otomatis di browser.</p>
      </Group>
    </>
  );
}

function ActionBtn({ icon: Icon, onClick, label, full }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition ${full ? 'w-full' : ''}`}>
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 px-3 py-2 bg-neutral-50/50 dark:bg-neutral-900/50">
      <div className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="font-medium truncate">{value}</div>
    </div>
  );
}

/* ============================================================
   PREVIEW
   ============================================================ */

export function PreviewPanel({ doc, pageW, pageH, zoom, setZoom, previewRef }) {
  const page = PAGE_SIZES[doc.pageSize];
  const isL = doc.orientation === 'landscape';
  const mmW = isL ? page.mmH : page.mmW;
  const mmH = isL ? page.mmW : page.mmH;

  const [pages, setPages] = useState(1);
  useEffect(() => {
    if (!previewRef.current) return;
    const el = previewRef.current;
    const update = () => setPages(Math.max(1, Math.ceil(el.scrollHeight / pageH)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [previewRef, pageH, doc]);

  return (
    <div className="flex flex-col min-h-0 bg-neutral-100 dark:bg-neutral-950">
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="inline-flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />Preview</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">{mmW}×{mmH} mm</span>
          <span>·</span>
          <span>{pages} halaman</span>
        </div>
        <div className="flex items-center gap-1">
          <IconBtn title="Zoom out" onClick={() => setZoom(Math.max(0.4, +(zoom - 0.1).toFixed(2)))}><ZoomOut className="w-4 h-4" /></IconBtn>
          <span className="text-xs w-12 text-center tabular-nums text-neutral-600 dark:text-neutral-300">{Math.round(zoom * 100)}%</span>
          <IconBtn title="Zoom in" onClick={() => setZoom(Math.min(1.6, +(zoom + 0.1).toFixed(2)))}><ZoomIn className="w-4 h-4" /></IconBtn>
          <IconBtn title="Fit" onClick={() => setZoom(0.75)}><ChevronsUpDown className="w-4 h-4" /></IconBtn>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 lg:p-10">
        <div style={{ width: pageW * zoom, margin: '0 auto', position: 'relative' }}>
          <PageBreakOverlay pageH={pageH} zoom={zoom} totalHeight={pageH * pages} />
          <div
            ref={previewRef}
            className="shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]"
            style={{
              width: pageW,
              minHeight: pageH,
              background: '#ffffff',
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              fontFamily: doc.fontFamily,
              fontSize: doc.fontSize,
              lineHeight: doc.lineHeight,
              color: '#111827',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Watermark text={doc.watermark} />
            <DocumentBody doc={doc} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PageBreakOverlay({ pageH, zoom, totalHeight }) {
  const count = Math.ceil(totalHeight / pageH);
  if (count <= 1) return null;
  return (
    <>
      {Array.from({ length: count - 1 }).map((_, i) => (
        <div key={i} className="absolute left-0 right-0 pointer-events-none z-10" style={{ top: (i + 1) * pageH * zoom }}>
          <div className="border-t border-dashed border-blue-400/60 dark:border-blue-500/60" />
          <div className="absolute right-0 -top-2.5 text-[10px] font-medium text-blue-500 bg-white dark:bg-neutral-950 px-1.5 rounded">Hal. {i + 2}</div>
        </div>
      ))}
    </>
  );
}

function Watermark({ text }) {
  if (!text) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center" style={{ zIndex: 0 }}>
      <div style={{ transform: 'rotate(-30deg)', fontSize: 120, fontWeight: 800, color: '#000', opacity: 0.05, whiteSpace: 'nowrap', letterSpacing: 8, userSelect: 'none' }}>
        {text}
      </div>
    </div>
  );
}

function DocumentBody({ doc }) {
  const p = doc.margin;
  if (doc.showCover) {
    return (
      <>
        <CoverPage doc={doc} />
        <div style={{ padding: p, position: 'relative' }}><ContentSections doc={doc} /></div>
      </>
    );
  }
  return <div style={{ padding: p, position: 'relative' }}><ContentSections doc={doc} /></div>;
}

function CoverPage({ doc }) {
  return (
    <div style={{
      height: PAGE_SIZES[doc.pageSize][doc.orientation === 'landscape' ? 'w' : 'h'],
      padding: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center',
      background: `linear-gradient(135deg, ${doc.accent}10 0%, ${doc.accent}00 60%)`,
      borderBottom: '1px solid #e5e7eb', position: 'relative',
    }}>
      {doc.logo && <img src={doc.logo} alt="" style={{ maxHeight: 90, maxWidth: 220, objectFit: 'contain', marginBottom: 48 }} />}
      <div style={{ height: 6, width: 64, background: doc.accent, borderRadius: 4, marginBottom: 32 }} />
      <h1 style={{ fontSize: '2.8em', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.15, letterSpacing: '-0.02em' }}>{doc.title || ' '}</h1>
      {doc.subtitle && <p style={{ marginTop: 16, fontSize: '1.15em', color: '#64748b', maxWidth: 520, lineHeight: 1.5 }}>{doc.subtitle}</p>}
      <div style={{ marginTop: 64, fontSize: '0.9em', color: '#64748b', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontWeight: 600, color: '#334155' }}>{doc.author}</div>
        <div>{doc.date}</div>
      </div>
    </div>
  );
}

function ContentSections({ doc }) {
  return (
    <>
      {doc.headerText && (
        <div style={{ fontSize: '0.75em', color: '#94a3b8', marginBottom: 32, paddingBottom: 8, borderBottom: '1px solid #f1f5f9', letterSpacing: '0.02em' }}>
          {doc.headerText}
        </div>
      )}

      {!doc.showCover && (
        <header style={{ borderBottom: `2px solid ${doc.accent}`, paddingBottom: 20, marginBottom: 32, display: 'flex', alignItems: 'flex-end', gap: 20 }}>
          {doc.logo && <img src={doc.logo} alt="" style={{ height: 56, width: 'auto', maxWidth: 120, objectFit: 'contain', flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '2em', fontWeight: 800, color: doc.accent, margin: 0, lineHeight: 1.15, letterSpacing: '-0.02em' }}>{doc.title || ' '}</h1>
            {doc.subtitle && <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '1em' }}>{doc.subtitle}</p>}
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', fontSize: '0.82em', color: '#9ca3af' }}>
              <span>{doc.author}</span><span>{doc.date}</span>
            </div>
          </div>
        </header>
      )}

      {doc.sections.map((s, i) => (
        <section key={i} style={{ marginBottom: 28, pageBreakInside: 'avoid', ...(s.breakBefore && i > 0 ? { pageBreakBefore: 'always', breakBefore: 'page' } : {}) }}>
          <SectionHeading text={s.heading} style={doc.headingStyle} color={doc.accent} />
          <p style={{ whiteSpace: 'pre-wrap', margin: 0, textAlign: s.align || 'left', color: '#1f2937' }}>{s.body}</p>
        </section>
      ))}

      {doc.footerText && (
        <footer style={{ marginTop: 48, paddingTop: 14, borderTop: '1px solid #e5e7eb', fontSize: '0.78em', color: '#9ca3af', textAlign: 'center' }}>
          {doc.footerText}
        </footer>
      )}
    </>
  );
}

function SectionHeading({ text, style: s, color }) {
  if (!text) return null;
  if (s === 'fill') return (
    <h2 style={{ display: 'inline-block', fontSize: '1.2em', fontWeight: 700, color: '#fff', background: color, padding: '6px 14px', borderRadius: 6, margin: '0 0 12px' }}>{text}</h2>
  );
  if (s === 'line') return (
    <h2 style={{ fontSize: '1.25em', fontWeight: 700, color: '#0f172a', margin: '0 0 12px', paddingBottom: 6, borderBottom: `2px solid ${color}`, display: 'inline-block' }}>
      <span style={{ color }}>—</span> {text}
    </h2>
  );
  return <h2 style={{ fontSize: '1.25em', fontWeight: 700, color, margin: '0 0 10px' }}>{text}</h2>;
}

/* ============================================================
   PRIMITIVES
   ============================================================ */

const selectCls = 'w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500';

function Group({ title, children }) {
  return (
    <section>
      <h3 className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400 mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 foc
