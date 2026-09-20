import { FileText, Download, Upload, FileJson, RotateCcw, Moon, Sun } from 'lucide-react';
import { IconBtn } from './ui';

export default function TopBar({
  doc, dark, exporting, progress,
  onToggleTheme, onExport, onReset, onExportJson, onImportJson,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur">
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center text-white">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight truncate">PDF Studio</div>
            <div className="text-[11px] text-neutral-500 truncate">
              {doc.title || 'Tanpa judul'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <IconBtn title="Import JSON" onClick={onImportJson}>
            <Upload className="w-4 h-4" />
          </IconBtn>
          <IconBtn title="Export JSON" onClick={onExportJson}>
            <FileJson className="w-4 h-4" />
          </IconBtn>
          <IconBtn title="Reset" onClick={onReset}>
            <RotateCcw className="w-4 h-4" />
          </IconBtn>
          <IconBtn title="Tema" onClick={onToggleTheme}>
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </IconBtn>
          <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800 mx-1" />
          <button
            onClick={onExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:opacity-90 disabled:opacity-60"
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
