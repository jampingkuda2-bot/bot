/* Deteksi tabel dari posisi teks PDF (pdf.js items) */

const Y_TOL = 4;
const X_GAP = 18;
const X_CLUSTER = 12;
const MIN_TABLE_ROWS = 2;
const MIN_TABLE_COLS = 2;

export function detectBlocks(items) {
  if (!items || items.length === 0) return [];

  const rows = groupIntoRows(items);
  const rowCells = rows.map(splitRowIntoCells);
  const columns = detectColumns(rowCells);

  if (columns.length < MIN_TABLE_COLS) {
    return rowCells.map((r) => ({
      type: 'text',
      text: r.cells.map((c) => c.text).join(' '),
    }));
  }

  const grids = buildGrid(rowCells, columns);
  return groupIntoBlocks(grids);
}

function groupIntoRows(items) {
  const sorted = [...items].sort((a, b) => b.y - a.y);
  const rows = [];
  let cur = null;
  for (const it of sorted) {
    if (!cur || Math.abs(cur.y - it.y) > Y_TOL) {
      cur = { y: it.y, items: [it] };
      rows.push(cur);
    } else {
      cur.items.push(it);
    }
  }
  rows.forEach((r) => r.items.sort((a, b) => a.x - b.x));
  return rows;
}

function splitRowIntoCells(row) {
  const cells = [];
  let cur = null;
  for (const it of row.items) {
    const w = it.width || it.str.length * 6;
    if (!cur) {
      cur = { x: it.x, endX: it.x + w, text: it.str };
      cells.push(cur);
      continue;
    }
    const gap = it.x - cur.endX;
    if (gap > X_GAP) {
      cur = { x: it.x, endX: it.x + w, text: it.str };
      cells.push(cur);
    } else {
      cur.text += it.str;
      cur.endX = it.x + w;
    }
  }
  return {
    y: row.y,
    cells: cells
      .map((c) => ({ x: c.x, text: c.text.trim() }))
      .filter((c) => c.text.length > 0),
  };
}

function detectColumns(rowCells) {
  const clusters = [];
  for (const row of rowCells) {
    for (const cell of row.cells) {
      let found = false;
      for (const c of clusters) {
        if (Math.abs(c.x - cell.x) < X_CLUSTER) {
          c.count++;
          found = true;
          break;
        }
      }
      if (!found) clusters.push({ x: cell.x, count: 1 });
    }
  }
  const minCount = Math.max(2, Math.ceil(rowCells.length * 0.3));
  return clusters
    .filter((c) => c.count >= minCount)
    .map((c) => c.x)
    .sort((a, b) => a - b);
}

function buildGrid(rowCells, columns) {
  return rowCells.map((row) => {
    const cells = new Array(columns.length).fill('');
    for (const cell of row.cells) {
      let idx = 0;
      for (let i = columns.length - 1; i >= 0; i--) {
        if (cell.x >= columns[i] - X_CLUSTER) {
          idx = i;
          break;
        }
      }
      cells[idx] = cells[idx] ? cells[idx] + ' ' + cell.text : cell.text;
    }
    return { y: row.y, cells, raw: row.cells.map((c) => c.text).join(' ') };
  });
}

function groupIntoBlocks(grids) {
  const blocks = [];
  let buf = [];

  const flush = () => {
    if (buf.length >= MIN_TABLE_ROWS) {
      blocks.push({ type: 'table', rows: buf.map((r) => r.cells) });
    } else {
      for (const r of buf) blocks.push({ type: 'text', text: r.raw });
    }
    buf = [];
  };

  for (const row of grids) {
    const filled = row.cells.filter((c) => c.trim()).length;
    if (filled >= MIN_TABLE_COLS) {
      buf.push(row);
    } else {
      flush();
      blocks.push({ type: 'text', text: row.raw });
    }
  }
  flush();
  return blocks;
}
