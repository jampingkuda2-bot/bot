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
  logo: { label: 'Logo' },
};

export default function ElementToolbar({ selected, doc, update, onClose, nudgeStep = 4 }) {
  if (!selected) return null;

  const isSection = selected.startsWith('sec_');
  const sectionId = isSection ? selected.slice(4) : null;
  const sectionIndex = isSection ? doc.sections.findIndex((s) => s.id === sectionId) : -1;

  if (isSection && sectionIndex < 0) return null;
  if (!isSection && !META[selected]) return null;

  const label = isSection ? `Bagian ${sectionIndex + 1}` : META[selected].label;
  const alignKey = !isSection ? META[selected].alignKey : null;
  const alignOptions = !isSection ? META[selected].alignOptions : null;

  const x = isSection
    ? (doc.sections[sectionIndex].offsetX || 0)
    : (doc[selected + 'OffsetX'] || 0);
  const y = isSection
    ? (doc.sections[sectionIndex].offsetY || 0)
    : (doc[selected + 'OffsetY'] || 0);

  const nudge = (dx, dy) => {
    if (isSection) {
      const arr = doc.sections.slice();
      arr[sectionIndex] = { ...arr[sectionIndex], offsetX: x + dx, offsetY: y + dy };
      update({ sections: arr });
    } else {
      update({ [selected + 'OffsetX']: x + dx, [selected + 'OffsetY']: y + dy });
    }
  };

  const reset = () => {
    if (isSection) {
      const arr = doc.sections.slice();
      arr[sectionIndex] = { ...arr[sectionIndex], offsetX: 0, offsetY: 0 };
      update({ sections: arr });
    } else {
      update({ [selected + 'OffsetX']: 0, [selected + 'OffsetY']: 0 });
    }
  };

  const remove = () => {
    if (isSection) {
      update({ sections: doc.sections.filter((_, i) => i !== sectionIndex) });
    } else if (selected === 'title') {
      update({ title: '', subtitle: '' });
    } else if (selected === 'author') {
      update({ author: '', date: '' });
    } else if (selected === 'logo') {
      update({ logo: null });
    }
    onClose();
  };

  const btn =
    'p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition text-neutral-600 dark:text-neutral-300 shrink-0';

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 py-1.5 flex items-center gap-1 overflow-x-auto">
      <span className="text-[11px] font-medium text-neutral-500 px-1 shrink-0 whitespace-nowrap">
        Edit: <span className="text-neutral-900 dark:text-white">{label}</span>
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

      {alignOptions && (
        <>
          <span className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 mx-1 shrink-0" />
          {alignOptions.map((opt) => {
            const Icon = opt.icon;
            const active = doc[alignKey] === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => update({ [alignKey]: opt.value })}
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
        title={isSection ? 'Hapus bagian ini' : 'Hapus konten'}
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
