import { Plus, Upload, Image as ImageIcon } from 'lucide-react';
import { Group, Field, TextInput, Toggle } from './ui';
import SectionCard from './SectionCard';

export default function ContentTab({
  doc, update, updateSection, addSection,
  removeSection, moveSection, duplicateSection, onLogoChange,
}) {
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
