'use client';

import { useState } from 'react';
import { X, Download, Loader2, FileText, FileType, FileCode, FileCode2, File, FileJson } from 'lucide-react';
import { EXPORT_FORMATS } from '../lib/export-file';

const ICONS = {
  pdf: FileText,
  docx: FileType,
  html: FileCode,
  md: FileCode2,
  txt: File,
  json: FileJson,
};

export default function ExportModal({ open, onClose, onExport, exporting, progress, disabled }) {
  const [format, setFormat] = useState('pdf');
  if (!open) return null;

  const handleClose = () => {
    if (exporting) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white dark:bg-neutral-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold">Export Dokumen</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={exporting}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 space-y-1.5 overflow-y-auto">
          {EXPORT_FORMATS.map((f) => {
            const Icon = ICONS[f.id] || File;
            const active = format === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                disabled={exporting}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition disabled:opacity-60 ${
                  active
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600' : 'text-neutral-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{f.label}</div>
                  <div className="text-[11px] text-neutral-500 truncate">{f.desc}</div>
                </div>
                {active && <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
              </button>
            );
          })}
        </div>

        {exporting && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 text-[12px] text-blue-700 dark:text-blue-300">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{progress || 'Memproses…'}</span>
            </div>
          </div>
        )}

        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={exporting}
            className="px-3 py-2 rounded-lg text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={() => onExport(format)}
            disabled={exporting || disabled}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export {format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
}
