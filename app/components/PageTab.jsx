import { PAGE_SIZES } from '../lib/constants';
import { Group, Field, TextInput, Toggle } from './ui';

export default function PageTab({ doc, update }) {
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
          <div className="text-[11px] text-neutral-500 mt-1.5">
            {page.mmW} × {page.mmH} mm
          </div>
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
                className={`py-2.5 rounded-lg border text-xs font-medium transition ${
                  doc.orientation === o.v
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label={`Margin — ${doc.margin}px`}>
          <input
            type="range" min={24} max={120} step={4}
            value={doc.margin}
            onChange={(e) => update({ margin: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
      </Group>

      <Group title="Header & Footer">
        <Field label="Teks header">
          <TextInput
            value={doc.headerText}
            onChange={(v) => update({ headerText: v })}
            placeholder="cth. Laporan Internal"
          />
        </Field>
        <Field label="Teks footer">
          <TextInput
            value={doc.footerText}
            onChange={(v) => update({ footerText: v })}
            placeholder="cth. © 2025 Nama Perusahaan"
          />
        </Field>
        <Toggle
          label="Nomor halaman"
          hint="Ditambahkan otomatis di bagian bawah"
          checked={doc.showPageNumbers}
          onChange={(v) => update({ showPageNumbers: v })}
        />
      </Group>

      <Group title="Watermark">
        <Field label="Teks watermark (diagonal)">
          <TextInput
            value={doc.watermark}
            onChange={(v) => update({ watermark: v })}
            placeholder="cth. RAHASIA"
          />
        </Field>
        <p className="text-[11px] text-neutral-500">Kosongkan untuk menonaktifkan.</p>
      </Group>
    </>
  );
}
