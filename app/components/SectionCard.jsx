import { useState } from 'react';
import { ChevronUp, ChevronDown, Copy, Trash2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { TextInput, MiniBtn } from './ui';

export default function SectionCard({
  index, section, onChange, onRemove, onMoveUp, onMoveDown,
  onDuplicate, canMoveUp, canMoveDown,
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 flex-1 text-left px-1 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <ChevronUp className={`w-3.5 h-3.5 text-neutral-400 transition ${open ? '' : 'rotate-180'}`} />
          <span className="text-xs font-medium truncate">
            {index + 1}. {section.heading || '(tanpa judul)'}
          </span>
        </button>
        <MiniBtn onClick={onMoveUp} disabled={!canMoveUp} title="Naik">
          <ChevronUp className="w-3.5 h-3.5" />
        </MiniBtn>
        <MiniBtn onClick={onMoveDown} disabled={!canMoveDown} title="Turun">
          <ChevronDown className="w-3.5 h-3.5" />
        </MiniBtn>
        <MiniBtn onClick={onDuplicate} title="Duplikat">
          <Copy className="w-3.5 h-3.5" />
        </MiniBtn>
        <MiniBtn onClick={onRemove} title="Hapus" danger>
          <Trash2 className="w-3.5 h-3.5" />
        </MiniBtn>
      </div>
      {open && (
        <div className="px-3 pb-3 space-y-2.5">
          <TextInput
            value={section.heading}
            onChange={(v) => onChange({ heading: v })}
            placeholder="Judul bagian"
          />
          <textarea
            value={section.body}
            onChange={(e) => onChange({ body: e.target.value })}
            placeholder="Isi bagian…"
            rows={5}
            className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y"
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
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!section.breakBefore}
                onChange={(e) => onChange({ breakBefore: e.target.checked })}
                className="accent-blue-600"
              />
              Halaman baru
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
