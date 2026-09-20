'use client';

import { useState } from 'react';
import {
  ChevronUp, ChevronDown, Copy, Trash2,
  AlignLeft, AlignCenter, AlignRight, Type,
  Type as TypeIcon, Table as TableIcon,
  Plus, Minus,
} from 'lucide-react';
import { TextInput, MiniBtn } from './ui';
import { FONTS } from '../lib/constants';

export default function SectionCard({
  index, section, onChange, onRemove, onMoveUp, onMoveDown,
  onDuplicate, canMoveUp, canMoveDown,
}) {
  const [open, setOpen] = useState(true);

  const isTable = section.type === 'table';
  const hasCustomFont = !!section.fontFamily;
  const hasCustomSize = section.fontSize && section.fontSize > 0;

  const changeType = (type) => {
    if (type === 'table') {
      onChange({
        type: 'table',
        tableData: section.tableData || {
          headerRow: true,
          numbering: true,
          rows: [['Kolom A', 'Kolom B', 'Kolom C'], ['', '', ''], ['', '', '']],
        },
      });
    } else {
      onChange({ type: 'text' });
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 flex-1 text-left px-1 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <ChevronUp className={`w-3.5 h-3.5 text-neutral-400 transition ${open ? '' : 'rotate-180'}`} />
          <span className="text-xs font-medium truncate">
            {index + 1}. {section.heading || (isTable ? '(tabel)' : '(tanpa judul)')}
          </span>
          {isTable && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 shrink-0">
              TABEL
            </span>
          )}
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
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
            <button
              onClick={() => changeType('text')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition ${
                !isTable
                  ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <TypeIcon className="w-3 h-3" />
              Teks
            </button>
            <button
              onClick={() => changeType('table')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition ${
                isTable
                  ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <TableIcon className="w-3 h-3" />
              Tabel
            </button>
          </div>

          <TextInput
            value={section.heading}
            onChange={(v) => onChange({ heading: v })}
            placeholder={isTable ? 'Judul tabel' : 'Judul bagian'}
          />

          {!isTable ? (
            <textarea
              value={section.body}
              onChange={(e) => onChange({ body: e.target.value })}
              placeholder="Isi bagian… (baris baru didukung)"
              rows={5}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-y"
            />
          ) : (
            <TableEditor
              tableData={section.tableData}
              onChange={(patch) => onChange({ tableData: { ...section.tableData, ...patch } })}
            />
          )}

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

/* ============================================================
   TABLE EDITOR
   ============================================================ */

function TableEditor({ tableData, onChange }) {
  const rows = tableData?.rows || [['', '', '']];
  const headerRow = tableData?.headerRow !== false;
  const numbering = tableData?.numbering !== false;

  const colCount = rows[0]?.length || 0;

  const updateCell = (r, c, val) => {
    const next = rows.map((row, ri) =>
      ri === r ? row.map((cell, ci) => (ci === c ? val : cell)) : row
    );
    onChange({ rows: next });
  };

  const addRow = () => {
    const cols = colCount || 1;
    onChange({ rows: [...rows, Array(cols).fill('')] });
  };

  const removeRow = () => {
    if (rows.length <= 1) return;
    onChange({ rows: rows.slice(0, -1) });
  };

  const addCol = () => {
    onChange({ rows: rows.map((r) => [...r, '']) });
  };

  const removeCol = () => {
    if (colCount <= 1) return;
    onChange({ rows: rows.map((r) => r.slice(0, -1)) });
  };

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2 space-y-2">
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <span className="text-[10px] text-neutral-500">
          {rows.length} baris × {colCount} kolom
        </span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-[10px] text-neutral-500 cursor-pointer">
            <input
              type="checkbox"
              checked={headerRow}
              onChange={(e) => onChange({ headerRow: e.target.checked })}
              className="accent-blue-600"
            />
            Header
          </label>
          <label className="flex items-center gap-1 text-[10px] text-neutral-500 cursor-pointer">
            <input
              type="checkbox"
              checked={numbering}
              onChange={(e) => onChange({ numbering: e.target.checked })}
              className="accent-blue-600"
            />
            Nomor
          </label>
        </div>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="space-y-1" style={{ minWidth: Math.max(220, colCount * 72) }}>
          {rows.map((row, ri) => {
            const isHeader = headerRow && ri === 0;
            const dataIndex = headerRow ? ri - 1 : ri;
            return (
              <div key={ri} className="flex gap-1 items-center">
                {numbering && (
                  <span className={`w-5 text-[10px] text-center shrink-0 ${
                    isHeader ? 'text-neutral-400' : 'text-neutral-500'
                  }`}>
                    {isHeader ? 'No.' : dataIndex + 1}
                  </span>
                )}
                {row.map((cell, ci) => (
                  <input
                    key={ci}
                    value={cell}
                    onChange={(e) => updateCell(ri, ci, e.target.value)}
                    placeholder={isHeader ? `H${ci + 1}` : ''}
                    className={`flex-1 min-w-0 px-1.5 py-1 text-[11px] rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500 ${
                      isHeader ? 'font-semibold bg-neutral-50 dark:bg-neutral-800/50' : ''
                    }`}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={addRow}
          className="flex items-center justify-center gap-1 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-[11px] hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
        >
          <Plus className="w-3 h-3" /> Baris
        </button>
        <button
          onClick={removeRow}
          disabled={rows.length <= 1}
          className="flex items-center justify-center gap-1 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-[11px] hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 disabled:opacity-40"
        >
          <Minus className="w-3 h-3" /> Baris
        </button>
        <button
          onClick={addCol}
          className="flex items-center justify-center gap-1 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-[11px] hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
        >
          <Plus className="w-3 h-3" /> Kolom
        </button>
        <button
          onClick={removeCol}
          disabled={colCount <= 1}
          className="flex items-center justify-center gap-1 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-[11px] hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 disabled:opacity-40"
        >
          <Minus className="w-3 h-3" /> Kolom
        </button>
      </div>
    </div>
  );
}
