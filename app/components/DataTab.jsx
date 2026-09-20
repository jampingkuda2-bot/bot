import { Download, Upload, Copy, Check } from 'lucide-react';
import { Group, ActionBtn, Stat } from './ui';

export default function DataTab({ doc, onExportJson, onImportJson, onCopyJson, copied, onReset }) {
  return (
    <>
      <Group title="Project">
        <div className="grid grid-cols-2 gap-2">
          <ActionBtn icon={Download} onClick={onExportJson} label="Export JSON" />
          <ActionBtn icon={Upload} onClick={onImportJson} label="Import JSON" />
        </div>
        <ActionBtn
          icon={copied ? Check : Copy}
          onClick={onCopyJson}
          label={copied ? 'Tersalin!' : 'Copy JSON ke clipboard'}
          full
        />
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
        <p className="text-[11px] text-neutral-500">
          Semua perubahanmu tersimpan otomatis di browser.
        </p>
      </Group>
    </>
  );
}
