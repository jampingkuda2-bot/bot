import {
  Plus, Upload, Image as ImageIcon,
  RotateCcw, Lock, Unlock,
} from 'lucide-react';
import { Group, Field, TextInput, Toggle } from './ui';
import SectionCard from './SectionCard';
import { FONTS } from '../lib/constants';

export default function ContentTab({
  doc, update, updateSection, addSection,
  removeSection, moveSection, duplicateSection, onLogoChange,
}) {
  const hasTitleOffset = (doc.titleOffsetX || 0) !== 0 || (doc.titleOffsetY || 0) !== 0;
  const hasLogoOffset = (doc.logoOffsetX || 0) !== 0 || (doc.logoOffsetY || 0) !== 0;
  const hasAuthorOffset = (doc.authorOffsetX || 0) !== 0 || (doc.authorOffsetY || 0) !== 0;
  const locked = !!doc.locked;
  const titleScale = doc.titleScale || 1;
  const logoSize = doc.logoSize || 56;
  const subtitleGap = doc.subtitleGap ?? 8;
  const authorFontSize = doc.authorFontSize || 0.82;

  return (
    <>
      <div className="mb-4">
        <button
          onClick={() => update({ locked: !locked })}
          className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition ${
            locked
              ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
              : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
          }`}
        >
          {locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          {locked ? 'Terkunci — klik untuk buka' : 'Kunci judul, logo & penulis'}
        </button>
        {locked && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2">
            🔒 Semua elemen terkunci.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 p-3 mb-4">
        <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
          💡 <b>Tips:</b> <b>Tap</b> judul, logo, atau penulis di preview → muncul
          toolbar untuk geser (<b>&lt; &gt; ^ v</b>), atur perataan, reset, atau hapus.
        </p>
      </div>

      <Group title="Informasi Dokumen">
        <Field label="Judul">
          <TextInput value={doc.title} onChange={(v) => update({ title: v })} placeholder="Judul dokumen" />
        </Field>

        <Field label={`Ukuran Judul — ${Math.round(titleScale * 100)}%`}>
          <input
            type="range"
            min={0.5}
            max={2.5}
            step={0.05}
            value={titleScale}
            onChange={(e) => update({ titleScale: Number(e.target.value) })}
            className="w-full"
          />
        </Field>

        {hasTitleOffset && (
          <button
            onClick={() => update({ titleOffsetX: 0, titleOffsetY: 0 })}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <RotateCcw className="w-3 h-3" />
            Reset posisi judul
          </button>
        )}

        <Field label="Subjudul">
          <textarea
            value={doc.subtitle || ''}
            onChange={(e) => update({ subtitle: e.target.value })}
            placeholder="Subjudul (bisa Enter untuk baris baru)"
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-y"
          />
        </Field>

        {doc.subtitle && (
          <Field label={`Jarak Judul–Subjudul — ${subtitleGap}px`}>
            <input
              type="range"
              min={0}
              max={80}
              step={2}
              value={subtitleGap}
              onChange={(e) => update({ subtitleGap: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
        )}

        <Field label="Penulis">
          <textarea
            value={doc.author || ''}
            onChange={(e) => update({ author: e.target.value })}
            placeholder="Nama penulis (bisa Enter untuk baris baru)"
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-y"
          />
        </Field>

        <Field label="Font Penulis">
          <select
            value={doc.authorFontFamily || ''}
            onChange={(e) => update({ authorFontFamily: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
          >
            <option value="">Sama dengan dokumen</option>
            {FONTS.map((f) => (
              <option key={f.label} value={f.value}>{f.label}</option>
            ))}
          </select>
        </Field>

        <Field label={`Ukuran Penulis — ${Math.round(authorFontSize * 100)}%`}>
          <input
            type="range"
            min={0.5}
            max={1.6}
            step={0.02}
            value={authorFontSize}
            onChange={(e) => update({ authorFontSize: Number(e.target.value) })}
            className="w-full"
          />
        </Field>

        {hasAuthorOffset && (
          <button
            onClick={() => update({ authorOffsetX: 0, authorOffsetY: 0 })}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <RotateCcw className="w-3 h-3" />
            Reset posisi penulis
          </button>
        )}

        <Field label="Tanggal">
          <TextInput value={doc.date} onChange={(v) => update({ date: v })} />
        </Field>
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
              <button
                onClick={() => update({ logo: null })}
                className="block text-[11px] text-red-600 hover:underline"
              >
                Hapus logo
              </button>
            )}
          </div>
        </div>

        {doc.logo && (
          <>
            <Field label={`Ukuran Logo — ${logoSize}px`}>
              <input
                type="range"
                min={20}
                max={220}
                step={4}
                value={logoSize}
                onChange={(e) => update({ logoSize: Number(e.target.value) })}
                className="w-full"
              />
            </Field>

            {(hasLogoOffset || logoSize !== 56) && (
              <button
                onClick={() => update({ logoOffsetX: 0, logoOffsetY: 0, logoSize: 56 })}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <RotateCcw className="w-3 h-3" />
                Reset logo
              </button>
            )}
          </>
        )}

        <Toggle
          label="Tampilkan cover page"
          hint="Halaman pertama khusus judul"
          checked={doc.showCover}
          onChange={(v) => update({ showCover: v })}
        />
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
            className="w-full py-2.5 text-sm rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-blue-500 hover:text-blue-600 text-neutral-500 transition"
          >
            <Plus className="w-4 h-4 inline -mt-0.5 mr-1" />
            Tambah Bagian
          </button>
        </div>
      </Group>
    </>
  );
}
