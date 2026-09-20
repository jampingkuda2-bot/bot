'use client';

import {
  AlignLeft, AlignCenter, AlignRight, ArrowLeftRight,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  RotateCcw, Trash2, X,
} from 'lucide-react';

const META = {
  title: {
    label: 'Judul',
    alignKey: 'titleAlign',
    alignOptions: [
      { value: 'left',   title: 'Kiri',   icon: AlignLeft },
      { value: 'center', title: 'Tengah', icon: AlignCenter },
      { value: 'right',  title: 'Kanan',  icon: AlignRight },
    ],
  },
  author: {
    label: 'Penulis',
    alignKey: 'authorAlign',
    alignOptions: [
      { value: 'split',  title: 'Terpisah', icon: ArrowLeftRight },
      { value: 'left',   title: 'Kiri',     icon: AlignLeft },
      { value: 'center', title: 'Tengah',   icon: AlignCenter },
      { value: 'right',  title: 'Kanan',    icon: AlignRight },
    ],
  },
  logo: {
    label: 'Logo',
  },
};

export default function ElementToolbar({ selected, doc, update, onClose, nudgeStep = 4 }) {
  if (!selected) return null;
  const meta = META[selected];
  if (!meta) return null;

  const xKey = selected + 'OffsetX';
  const yKey = selected + 'OffsetY';
  const x = doc[xKey] || 0;
  const y = doc[yKey] || 0;

  const nudge = (dx, dy) => update({ [xKey]: x + dx, [yKey]: y + dy });
  const reset = () => update({ [xKey]: 0, [yKey]: 0 });
  const remove = () => {
    if (selected === 'title') update({ title: '', subtitle: '' });
    else if (selected === 'author') update({ author: '', date: '' });
    else if (selected === 'logo') update({ logo: null });
    onClose();
  };

  const btn =
    'p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition text-neutral-600 dark:text-neutral-300 shrink-0';

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 py-1.5 flex items-center gap-1 overflow-x-auto">
      <span className="text-[11px] font-medium text-neutral-500 px-1 shrink-0 whitespace-nowrap">
        Edit: <span className="text-neutral-900 dark:text-white">{meta.label}</span>
      </span>
      <span className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 mx-1 shrink-0" />

      <button onClick={() => nudge(-nudgeStep, 0)} className={btn} title="Geser kiri">
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => nudge(nudgeStep, 0)} className={btn} title="Geser kanan">
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => nudge(0, -nudgeStep)} className={btn} title="Geser atas">
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => nudge(0, nudgeStep)} className={btn} title="Geser bawah">
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {meta.alignOptions && (
        <>
          <span className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 mx-1 shrink-0" />
          {meta.alignOptions.map((opt) => {
            const Icon = opt.icon;
            const active = doc[meta.alignKey] === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => update({ [meta.alignKey]: opt.value })}
                className={`p-1.5 rounded-md transition shrink-0 ${
                  active
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300'
                    : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                }`}
                title={opt.title}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </>
      )}

      <span className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 mx-1 shrink-0" />
      <button onClick={reset} className={btn} title="Reset posisi">
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={remove}
        className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 transition shrink-0"
        title="Hapus konten"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <span className="flex-1 min-w-2" />
      <button onClick={onClose} className={btn} title="Tutup">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
