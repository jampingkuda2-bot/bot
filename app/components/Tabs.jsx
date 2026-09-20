import { Palette, Layout as LayoutIcon, FileJson, FileType } from 'lucide-react';

const TABS = [
  { id: 'content', label: 'Konten',  icon: FileType },
  { id: 'style',   label: 'Gaya',    icon: Palette },
  { id: 'page',    label: 'Halaman', icon: LayoutIcon },
  { id: 'data',    label: 'Data',    icon: FileJson },
];

export default function Tabs({ tab, setTab }) {
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 grid grid-cols-4 bg-white dark:bg-neutral-900">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition relative ${
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
