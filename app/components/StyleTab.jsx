import { FONTS, TEMPLATES, ACCENT_PRESETS } from '../lib/constants';
import { Group, Field } from './ui';

export default function StyleTab({ doc, update }) {
  const applyTemplate = (t) => update({
    template: t.id,
    accent: t.accent,
    fontFamily: FONTS[t.font].value,
    headingStyle: t.heading,
    lineHeight: t.lineHeight,
    plain: !!t.plain,
  });

  return (
    <>
      <Group title="Template">
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((t) => {
            const active = doc.template === t.id;
            const cardAccent = t.plain ? '#111827' : t.accent;
            return (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className={`rounded-xl border p-3 text-sm font-medium transition ${
                  active
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                }`}
              >
                <div className="w-full aspect-[3/4] rounded-md mb-2 overflow-hidden bg-white border border-neutral-100 p-2">
                  <div
                    style={{
                      height: t.plain ? 3 : 4,
                      width: t.plain ? '60%' : '100%',
                      background: cardAccent,
                      borderRadius: 2,
                    }}
                  />
                  <div className="mt-2 space-y-1">
                    <div className="h-1 rounded-full bg-neutral-200" style={{ width: '100%' }} />
                    <div className="h-1 rounded-full bg-neutral-200" style={{ width: '85%' }} />
                  </div>
                  <div
                    style={{
                      height: 3,
                      width: '50%',
                      background: cardAccent,
                      borderRadius: 2,
                      marginTop: 10,
                    }}
                  />
                  <div className="mt-2 space-y-1">
                    <div className="h-1 rounded-full bg-neutral-200" style={{ width: '95%' }} />
                    <div className="h-1 rounded-full bg-neutral-200" style={{ width: '70%' }} />
                  </div>
                </div>
                <div className="text-[11px] text-center">{t.name}</div>
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Warna Aksen">
        {doc.plain ? (
          <p className="text-[11px] text-neutral-500">
            Template Polos tidak memakai warna aksen. Pilih template lain untuk mengaktifkan warna.
          </p>
        ) : (
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
            <input
              type="color"
              value={doc.accent}
              onChange={(e) => update({ accent: e.target.value })}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-[11px] font-mono text-neutral-500">{doc.accent}</span>
          </div>
        )}
      </Group>

      <Group title="Tipografi">
        <Field label="Font">
          <select
            value={doc.fontFamily}
            onChange={(e) => update({ fontFamily: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
          >
            {FONTS.map((f) => (
              <option key={f.label} value={f.value}>{f.label}</option>
            ))}
          </select>
        </Field>
        <Field label={`Ukuran font — ${doc.fontSize}px`}>
          <input
            type="range" min={11} max={22} step={1}
            value={doc.fontSize}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
        <Field label={`Line height — ${doc.lineHeight.toFixed(2)}`}>
          <input
            type="range" min={1.3} max={2.2} step={0.05}
            value={doc.lineHeight}
            onChange={(e) => update({ lineHeight: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
      </Group>

      {!doc.plain && (
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
                <div className="mx-auto w-10 h-1.5 rounded-sm" style={{ background: doc.accent }} />
                <div className="mt-1.5">{o.label}</div>
              </button>
            ))}
          </div>
        </Group>
      )}
    </>
  );
}
