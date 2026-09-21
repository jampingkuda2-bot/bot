'use client';

import { useState } from 'react';
import { X, Upload, FileText, Loader2, Check } from 'lucide-react';
import { extractTextFromPdf, sectionsToDocSections } from '../lib/pdf-import';

export default function ImportPdfModal({ open, onClose, onImport, hasExistingContent }) {
  const [file, setFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState('replace');
  const [error, setError] = useState('');

  if (!open) return null;

  const reset = () => {
    setFile(null);
    setExtracting(false);
    setProgress(0);
    setStatus('');
    setResult(null);
    setError('');
    setMode('replace');
  };

  const handleClose = () => {
    if (extracting) return;
    reset();
    onClose();
  };

  const handleFile = async (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setError('File harus berformat PDF');
      return;
    }
    if (f.size > 30 * 1024 * 1024) {
      setError('File terlalu besar (maks 30 MB)');
      return;
    }
    setError('');
    setFile(f);
    setExtracting(true);
    setResult(null);
    setProgress(0);

    try {
      const res = await extractTextFromPdf(f, (pct, msg) => {
        setProgress(pct);
        setStatus(msg);
      });

      if (!res.rawText.trim()) {
        setError('Tidak ada teks yang terbaca. PDF ini mungkin hasil scan (gambar), bukan teks.');
        setExtracting(false);
        return;
      }

      setResult(res);
    } catch (e) {
      console.error(e);
      setError('Gagal membaca PDF: ' + (e.message || 'unknown'));
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = () => {
    if (!result) return;
    const newSections = sectionsToDocSections(result.sections);
    onImport(newSections, mode);
    reset();
    onClose();
  };

  const fileInput = (e) => handleFile(e.target.files?.[0]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white dark:bg-neutral-900 w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">

        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold">Import PDF</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={extracting}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!file && (
            <label className="block border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition">
              <Upload className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
              <div className="text-sm font-medium">Pilih file PDF</div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Max 30 MB · PDF dengan teks (bukan hasil scan)
              </div>
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={fileInput}
              />
            </label>
          )}

          {file && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{file.name}</div>
                <div className="text-[11px] text-neutral-500">
                  {(file.size / 1024).toFixed(0)} KB
                </div>
              </div>
              {!extracting && (
                <button
                  onClick={reset}
                  className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  title="Ganti file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {extracting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>{status || 'Memproses…'}</span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-[12px] text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {result && !extracting && (
            <>
              <div className="flex items-center gap-2 text-[12px] text-emerald-700 dark:text-emerald-300">
                <Check className="w-4 h-4" />
                <span>
                  Berhasil baca {result.totalPages} halaman · {result.sections.length} bagian terdeteksi
                </span>
              </div>

              <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 max-h-64 overflow-y-auto p-3 space-y-2.5">
                {result.sections.slice(0, 20).map((s, i) => (
                  <div key={i} className="text-[12px] leading-relaxed">
                    {s.heading && (
                      <div className="font-semibold text-neutral-900 dark:text-white">
                        {s.heading}
                      </div>
                    )}
                    {s.body && (
                      <div className="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                        {s.body.slice(0, 180)}
                        {s.body.length > 180 ? '…' : ''}
                      </div>
                    )}
                  </div>
                ))}
                {result.sections.length > 20 && (
                  <div className="text-[11px] text-neutral-500 italic">
                    … dan {result.sections.length - 20} bagian lagi
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  Mode import:
                </div>
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <input
                    type="radio"
                    checked={mode === 'replace'}
                    onChange={() => setMode('replace')}
                    className="accent-blue-600"
                  />
                  <div className="text-[12px]">
                    <div className="font-medium">Ganti dokumen ini</div>
                    <div className="text-[10px] text-neutral-500">
                      Hapus semua isi, mulai dari PDF
                    </div>
                  </div>
                </label>
                {hasExistingContent && (
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <input
                      type="radio"
                      checked={mode === 'append'}
                      onChange={() => setMode('append')}
                      className="accent-blue-600"
                    />
                    <div className="text-[12px]">
                      <div className="font-medium">Tambah ke dokumen</div>
                      <div className="text-[10px] text-neutral-500">
                        Sisipkan di akhir dokumen saat ini
                      </div>
                    </div>
                  </label>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={handleClose}
            disabled={extracting}
            className="px-3 py-2 rounded-lg text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!result || extracting}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Masuk Editor
          </button>
        </div>
      </div>
    </div>
  );
}
