'use client';

import { useState } from 'react';
import {
  ChevronUp, ChevronDown, Copy, Trash2,
  AlignLeft, AlignCenter, AlignRight,
  Type as TypeIcon, Table as TableIcon,
  Plus, Minus,
} from 'lucide-react';
import { MiniBtn } from './ui';
import { FONTS } from '../lib/constants';

export default function SectionCard({
  index, section, onChange, onRemove, onMoveUp, onMoveDown,
  onDuplicate, canMoveUp, canMoveDown,
}) {
  const [open, setOpen] = useState(true);
  const isTable = section.type === 'table';
  const hasCustomSize = section.fontSize && section.fontSize > 0;

  const changeType = (type) => {
    if (type === section.type) return;
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
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
      {/* HEADER */}
      <div className="flex items-center gap-0.5 pl-1.5 pr-1 py-1">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 px-0.5"
        >
          <ChevronUp className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition ${open ? '' : 'rotate-180'}`} />
          <span className="text-[12px] font-medium truncate">
            {index + 1}. {section.heading || (isTable ? '(tabel)' : '(tanpa judul)')}
          </span>
          {isTable && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 shrink-0">
              TBL
            </span>
          )}
          {hasCustomSize && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 shrink-0">
              {section.fontSize}px
            </span>
          )}
        </button>

        {/* Toggle Teks / Tabel — compact icon-only */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 shrink-0">
          <button
            onClick={() => changeType('text')}
            title="Teks"
            className={`p-1 rounded transition ${
              !isTable
                ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <TypeIcon className="w-3 h-3" />
          </button>
          <button
            onClick={() => changeType('table')}
            title="Tabel"
            className={`p-1 rounded transition ${
              isTable
                ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <TableIcon className="w-3 h-3" />
          </button>
        </div>

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
        <div className="px-2 pb-2 space-y-1.5">
          {/* Heading */}
          <input
            type="text"
            value={section.heading || ''}
            onChange={(e) => onChange({ heading: e.target.value })}
            placeholder={isTable ? 'Judul tabel' : 'Judul bagian'}
            className="w-full px-2 py-1 text-[13px] rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />

          {/* Body / Table */}
          {!isTable ? (
            <textarea
              value={section.body}
              onChange={(e) => onChange({ body: e.target.value })}
              placeholder="Isi bagian…"
              rows={4}
              className="w-full px-2 py-1.5 text-[13px] rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-y min-h-[60px]"
            />
          ) : (
            <TableEditor
              tableData={section.tableData}
              onChange={(patch) => onChange({ tableData: { ...section.tableData, ...patch } })}
            />
          )}

          {/* Font + Ukuran — 1 baris */}
          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={section.fontFamily || ''}
              onChange={(e) => onChange({ fontFamily: e.target.value })}
              className="w-full px-1.5 py-1 text-[11px] rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200"
            >
              <option value="">Font: Auto</option>
              {FONTS.map((f) => (
                <option key={f.label} value={f.value}>{f.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-1 px-1.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <input
                type="range"
                min={0}
                max={48}
                step={1}
                value={section.fontSize || 0}
                onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
                className="flex-1 min-w-0"
              />
              <span className="text-[10px] text-neutral-500 tabular-nums shrink-0 w-8 text-right">
                {hasCustomSize ? `${section.fontSize}px` : 'Auto'}
              </span>
            </div>
          </div>

          {/* Align + break */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800">
              {[
                { v: 'left',   Icon: AlignLeft },
                { v: 'center', Icon: AlignCenter },
                { v: 'right',  Icon: AlignRight },
              ].map(({ v, Icon }) => (
                <button
                  key={v}
                  onClick={() => onChange({ align: v })}
                  className={`p-1 rounded transition ${
                    section.align === v
                      ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title={v}
                >
                  <Icon className="w-3 h-3" />
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1 text-[10px] text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!section.breakBefore}
                onChange={(e) => onChange({ breakBefore: e.target.checked })}
                className="accent-blue-600 w-3.5 h-3.5"
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
   TABLE EDITOR — compact
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

  const addRow = () => onChange({ rows: [...rows, Array(colCount || 1).fill('')] });
  const removeRow = () => { if (rows.length > 1) onChange({ rows: rows.slice(0, -1) }); };
  const addCol = () => onChange({ rows: rows.map((r) => [...r, '']) });
  const removeCol = () => { if (colCount > 1) onChange({ rows: rows.map((r) => r.slice(0, -1)) }); };

  return (
    <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-1.5 space-y-1.5">
      {/* Grid input */}
      <div className="overflow-x-auto -mx-0.5 px-0.5">
        <div className="space-y-0.5" style={{ minWidth: Math.max(200, colCount * 64) }}>
          {rows.map((row, ri) => {
            const isHeader = headerRow && ri === 0;
            const dataIndex = headerRow ? ri - 1 : ri;
            return (
              <div key={ri} className="flex gap-0.5 items-center">
                {numbering && (
                  <span className="w-4 text-[9px] text-center shrink-0 text-neutral-400 tabular-nums">
                    {isHeader ? 'No.' : dataIndex + 1}
                  </span>
                )}
                {row.map((cell, ci) => (
                  <input
                    key={ci}
                    value={cell}
                    onChange={(e) => updateCell(ri, ci, e.target.value)}
                    placeholder={isHeader ? `H${ci + 1}` : ''}
                    className={`flex-1 min-w-0 px-1 py-0.5 text-[11px] rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-500/40 ${
                      isHeader ? 'font-semibold bg-neutral-50 dark:bg-neutral-800/60' : ''
                    }`}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Semua kontrol dalam 1 baris */}
      <div className="flex items-center gap-1 flex-wrap">
        <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800">
          <button
            onClick={addRow}
            title="Tambah baris"
            className="p-1 rounded hover:bg-white dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
          >
            <Plus className="w-3 h-3" />
          </button>
          <span className="text-[9px] text-neutral-500 px-0.5">Baris</span>
          <button
            onClick={removeRow}
            disabled={rows.length <= 1}
            title="Hapus baris"
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 disabled:opacity-30"
          >
            <Minus className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800">
          <button
            onClick={addCol}
            title="Tambah kolom"
            className="p-1 rounded hover:bg-white dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
          >
            <Plus className="w-3 h-3" />
          </button>
          <span className="text-[9px] text-neutral-500 px-0.5">Kolom</span>
          <button
            onClick={removeCol}
            disabled={colCount <= 1}
            title="Hapus kolom"
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 disabled:opacity-30"
          >
            <Minus className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <label className="flex items-center gap-1 text-[10px] text-neutral-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={headerRow}
              onChange={(e) => onChange({ headerRow: e.target.checked })}
              className="accent-blue-600 w-3.5 h-3.5"
            />
            Header
          </label>
          <label className="flex items-center gap-1 text-[10px] text-neutral-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={numbering}
              onChange={(e) => onChange({ numbering: e.target.checked })}
              className="accent-blue-600 w-3.5 h-3.5"
            />
            Nomor
          </label>
        </div>
      </div>
    </div>
  );
}
