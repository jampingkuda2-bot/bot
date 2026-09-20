'use client';

import { useState } from 'react';
import {
  ChevronUp, ChevronDown, Copy, Trash2,
  AlignLeft, AlignCenter, AlignRight, Type,
} from 'lucide-react';
import { TextInput, MiniBtn } from './ui';
import { FONTS } from '../lib/constants';

export default function SectionCard({
  index, section, onChange, onRemove, onMoveUp, onMoveDown,
  onDuplicate, canMoveUp, canMoveDown,
}) {
  const [open, setOpen] = useState(true);

  const hasCustomFont = !!section.fontFamily;
  const hasCustomSize = section.fontSize && section.fontSize > 0;

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
          {(hasCustomFont || hasCustomSize) && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 shrink-0">
              {hasCustomSize ? `${section.fontSize}px` : 'custom'}
            </span>
          )}
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
        <div className="px-3 pb-3 space-y-3">
          <TextInput
            value={section.heading}
            onChange={(v) => onChange({ heading: v })}
            placeholder="Judul bagian"
          />

          <textarea
            value={section.body}
            onChange={(e) => onChange({ body: e.target.value })}
            placeholder="Isi bagian… (baris baru didukung)"
            rows={5}
            className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-y"
          />

          {/* Font & Size */}
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 p-2.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-neutral-500">
              <Type className="w-3 h-3" />
              Teks
            </div>

            <select
              value={section.fontFamily || ''}
              onChange={(e) => onChange({ fontFamily: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200"
            >
              <option value="">Font: ikuti dokumen</option>
              {FONTS.map((f) => (
                <option key={f.label} value={f.value}>Font: {f.label}</option>
              ))}
            </select>

            <div>
              <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
                <span>
                  Ukuran:{' '}
                  <span className="text-neutral-900 dark:text-white font-medium">
                    {hasCustomSize ? `${section.fontSize}px` : 'Auto'}
                  </span>
                </span>
                {hasCustomSize && (
                  <button
                    onClick={() => onChange({ fontSize: 0 })}
                    className="text-[10px] text-blue-600 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              <input
                type="range"
                min={0}
                max={48}
                step={1}
                value={section.fontSize || 0}
                onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-[9px] text-neutral-400 mt-0.5">
                <span>Auto</span>
                <span>24px</span>
                <span>48px</span>
              </div>
            </div>
          </div>

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
                  title={v}
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
