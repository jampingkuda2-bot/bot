import { FileText, Download, Upload, FileJson, RotateCcw, Moon, Sun, FileUp } from 'lucide-react';
import { IconBtn } from './ui';

export default function TopBar({
  doc, dark, exporting, progress,
  onToggleTheme, onExport, onReset, onExportJson, onImportJson, onImportPdf,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur">
      <div className="px-2.5 py-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center text-white shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold leading-tight truncate">PDF Studio</div>
            <div className="text-[10px] text-neutral-500 truncate leading-tight">
              {doc.title || 'Tanpa judul'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <IconBtn title="Import Dokumen" onClick={onImportPdf}>
            <FileUp className="w-4 h-4" />
          </IconBtn>
          <IconBtn title="Import JSON" onClick={onImportJson}>
            <Upload className="w-4 h-4" />
          </IconBtn>
          <IconBtn title="Reset" onClick={onReset}>
            <RotateCcw className="w-4 h-4" />
          </IconBtn>
          <IconBtn title="Tema" onClick={onToggleTheme}>
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </IconBtn>
          <button
            onClick={onExport}
            className="ml-1 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[12px] font-medium hover:opacity-90"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Ekspor</span>
          </button>
        </div>
      </div>
    </header>
  );
}
