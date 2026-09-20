'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  PAGE_SIZES, buildInitialDoc, normalizeDoc, uid,
  createTextSection, createTableSection,
  STORAGE_KEY, THEME_KEY, loadLocal, downloadBlob, slug,
} from './lib/constants';
import { exportPdf } from './lib/pdf';
import TopBar from './components/TopBar';
import Tabs from './components/Tabs';
import ContentTab from './components/ContentTab';
import StyleTab from './components/StyleTab';
import PageTab from './components/PageTab';
import DataTab from './components/DataTab';
import PreviewPanel from './components/PreviewPanel';

export default function Home() {
  const [doc, setDoc] = useState(buildInitialDoc);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('content');
  const [dark, setDark] = useState(false);
  const [zoom, setZoom] = useState(0.4);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [copied, setCopied] = useState(false);
  const [focusLast, setFocusLast] = useState(0);
  const previewRef = useRef(null);
  const importRef = useRef(null);

  useEffect(() => {
    setDoc(loadLocal(STORAGE_KEY, buildInitialDoc()));
    setDark(document.documentElement.classList.contains('dark'));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(doc)); } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [doc, ready]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem(THEME_KEY, next ? 'dark' : 'light'); } catch {}
  };

  const update = useCallback((patch) => setDoc((d) => ({ ...d, ...patch })), []);

  const updateSection = (i, patch) => setDoc((d) => {
    const s = d.sections.slice();
    s[i] = { ...s[i], ...patch };
    return { ...d, sections: s };
  });

  const addSection = (type = 'text') => {
    setDoc((d) => ({
      ...d,
      sections: [
        ...d.sections,
        type === 'table' ? createTableSection() : createTextSection(),
      ],
    }));
    setFocusLast((v) => v + 1);
  };

  const removeSection = (i) => setDoc((d) => ({
    ...d,
    sections: d.sections.filter((_, idx) => idx !== i),
  }));

  const moveSection = (i, dir) => setDoc((d) => {
    const s = d.sections.slice();
    const j = i + dir;
    if (j < 0 || j >= s.length) return d;
    [s[i], s[j]] = [s[j], s[i]];
    return { ...d, sections: s };
  });

  const duplicateSection = (i) => setDoc((d) => {
    const s = d.sections.slice();
    s.splice(i + 1, 0, { ...s[i], id: uid(), offsetX: 0, offsetY: 0 });
    return { ...d, sections: s };
  });

  const onLogoChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => update({ logo: reader.result });
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  const exportJson = () => downloadBlob(JSON.stringify(doc, null, 2), `${slug(doc.title)}.json`);

  const importJson = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        setDoc(normalizeDoc(parsed));
      } catch { alert('File JSON tidak valid.'); }
    };
    reader.readAsText(f);
    e.target.value = '';
  };

  const handleExport = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    setProgress('Memulai…');
    try {
      await exportPdf(previewRef.current, doc, setProgress);
    } catch (e) {
      alert('Gagal membuat PDF: ' + e.message);
    } finally {
      setExporting(false);
      setProgress('');
    }
  };

  const resetDoc = () => {
    if (!confirm('Reset semua perubahan ke contoh awal?')) return;
    setDoc(buildInitialDoc());
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const page = PAGE_SIZES[doc.pageSize];
  const isL = doc.orientation === 'landscape';
  const pageW = isL ? page.h : page.w;
  const pageH = isL ? page.w : page.h;

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-neutral-400">
        Memuat…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        doc={doc}
        dark={dark}
        exporting={exporting}
        progress={progress}
        onToggleTheme={toggleTheme}
        onExport={handleExport}
        onReset={resetDoc}
        onExportJson={exportJson}
        onImportJson={() => importRef.current?.click()}
      />
      <input
        ref={importRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={importJson}
      />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[400px_1fr] min-h-0">
        <aside className="border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col min-h-0 lg:max-h-[calc(100vh-57px)]">
          <Tabs tab={tab} setTab={setTab} />
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {tab === 'content' && (
              <ContentTab
                doc={doc}
                update={update}
                updateSection={updateSection}
                addSection={addSection}
                removeSection={removeSection}
                moveSection={moveSection}
                duplicateSection={duplicateSection}
                onLogoChange={onLogoChange}
              />
            )}
            {tab === 'style' && <StyleTab doc={doc} update={update} />}
            {tab === 'page' && <PageTab doc={doc} update={update} />}
            {tab === 'data' && (
              <DataTab
                doc={doc}
                onExportJson={exportJson}
                onImportJson={() => importRef.current?.click()}
                onCopyJson={copyJson}
                copied={copied}
                onReset={resetDoc}
              />
            )}
          </div>
        </aside>
        <PreviewPanel
          doc={doc}
          update={update}
          pageW={pageW}
          pageH={pageH}
          zoom={zoom}
          setZoom={setZoom}
          previewRef={previewRef}
          focusLast={focusLast}
        />
      </div>
    </div>
  );
}
