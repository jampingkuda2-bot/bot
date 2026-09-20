"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

/* ---------- Types ---------- */

type Kind = "text" | "image" | "rect";

interface BaseEl {
  id: string;
  kind: Kind;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TextEl extends BaseEl {
  kind: "text";
  text: string;
  fontSize: number;
  fontFamily: "Space Grotesk" | "Fraunces" | "Georgia";
  color: string;
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right";
}

interface ImageEl extends BaseEl {
  kind: "image";
  src: string;
}

interface RectEl extends BaseEl {
  kind: "rect";
  fill: string;
  radius: number;
}

type ElementData = TextEl | ImageEl | RectEl;

interface PageData {
  id: string;
  bg: string;
  elements: ElementData[];
}

const PAGE_W = 595;
const PAGE_H = 842;

const uid = () => Math.random().toString(36).slice(2, 10);

const newPage = (): PageData => ({ id: uid(), bg: "#ffffff", elements: [] });

/* ---------- Component ---------- */

export default function Page() {
  const [pages, setPages] = useState<PageData[]>([newPage()]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const pageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{
    id: string;
    mode: "move" | "resize";
    startX: number;
    startY: number;
    orig: ElementData;
  } | null>(null);

  const active = pages[activeIdx];
  const selected = active?.elements.find((e) => e.id === selectedId) || null;

  const updatePage = useCallback(
    (idx: number, fn: (p: PageData) => PageData) => {
      setPages((prev) => prev.map((p, i) => (i === idx ? fn(p) : p)));
    },
    []
  );

  const updateElement = useCallback(
    (id: string, patch: Partial<ElementData>) => {
      updatePage(activeIdx, (p) => ({
        ...p,
        elements: p.elements.map((e) =>
          e.id === id ? ({ ...e, ...patch } as ElementData) : e
        ),
      }));
    },
    [activeIdx, updatePage]
  );

  const addElement = (el: ElementData) => {
    updatePage(activeIdx, (p) => ({ ...p, elements: [...p.elements, el] }));
    setSelectedId(el.id);
  };

  const addText = () => {
    addElement({
      id: uid(),
      kind: "text",
      x: 80,
      y: 100,
      w: 300,
      h: 60,
      text: "Ketik di sini",
      fontSize: 22,
      fontFamily: "Space Grotesk",
      color: "#1b1f26",
      bold: false,
      italic: false,
      align: "left",
    });
  };

  const addRect = () => {
    addElement({
      id: uid(),
      kind: "rect",
      x: 100,
      y: 140,
      w: 220,
      h: 140,
      fill: "#d9a441",
      radius: 8,
    });
  };

  const addImageClick = () => fileInputRef.current?.click();

  const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const maxW = 320;
        const ratio = img.naturalHeight / img.naturalWidth;
        const w = Math.min(maxW, img.naturalWidth);
        const h = w * ratio;
        addElement({
          id: uid(),
          kind: "image",
          x: 90,
          y: 120,
          w,
          h,
          src,
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    updatePage(activeIdx, (p) => ({
      ...p,
      elements: p.elements.filter((e) => e.id !== selectedId),
    }));
    setSelectedId(null);
  }, [selectedId, activeIdx, updatePage]);

  const duplicateSelected = () => {
    if (!selected) return;
    const copy = { ...selected, id: uid(), x: selected.x + 16, y: selected.y + 16 };
    updatePage(activeIdx, (p) => ({ ...p, elements: [...p.elements, copy] }));
    setSelectedId(copy.id);
  };

  /* ---- pointer drag / resize ---- */

  const onPointerDownEl = (
    e: React.PointerEvent,
    el: ElementData,
    mode: "move" | "resize"
  ) => {
    if (editingId === el.id) return;
    e.stopPropagation();
    setSelectedId(el.id);
    dragRef.current = {
      id: el.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      orig: el,
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (d.mode === "move") {
      updateElement(d.id, {
        x: Math.round(d.orig.x + dx),
        y: Math.round(d.orig.y + dy),
      });
    } else {
      updateElement(d.id, {
        w: Math.max(24, Math.round(d.orig.w + dx)),
        h: Math.max(24, Math.round(d.orig.h + dy)),
      });
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };

  /* ---- keyboard delete ---- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const editable = (e.target as HTMLElement)?.isContentEditable;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || editable) return;
      if ((e.key === "Backspace" || e.key === "Delete") && selectedId) {
        e.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, deleteSelected]);

  /* ---- pages ---- */

  const addPage = () => {
    setPages((prev) => [...prev, newPage()]);
    setActiveIdx(pages.length);
    setSelectedId(null);
  };

  const deletePage = (idx: number) => {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((_, i) => i !== idx));
    setActiveIdx((prev) => Math.max(0, prev >= idx ? prev - 1 : prev));
    setSelectedId(null);
  };

  /* ---- export ---- */

  const exportPdf = async () => {
    setExporting(true);
    setSelectedId(null);
    setEditingId(null);
    const originalIdx = activeIdx;
    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      for (let i = 0; i < pages.length; i++) {
        setActiveIdx(i);
        // wait for React to paint the page before capturing it
        await new Promise((r) => setTimeout(r, 80));
        if (!pageRef.current) continue;
        const canvas = await html2canvas(pageRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: pages[i].bg || "#ffffff",
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        if (i > 0) doc.addPage();
        const pw = doc.internal.pageSize.getWidth();
        const ph = doc.internal.pageSize.getHeight();
        doc.addImage(imgData, "JPEG", 0, 0, pw, ph);
      }
      doc.save("dokumen.pdf");
    } finally {
      setActiveIdx(originalIdx);
      setExporting(false);
    }
  };

  /* ---------- render ---------- */

  return (
    <div style={styles.app}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={onFileChosen}
      />

      {/* Left toolbar */}
      <aside style={styles.sidebar} className="scrollbar-thin">
        <div style={styles.brand}>
          <span style={styles.brandMark}>K</span>
          <span style={styles.brandName}>Kertas</span>
        </div>

        <div style={styles.sideSection}>
          <div style={styles.sideLabel}>Tambah elemen</div>
          <button style={styles.toolBtn} onClick={addText}>
            + Teks
          </button>
          <button style={styles.toolBtn} onClick={addImageClick}>
            + Gambar
          </button>
          <button style={styles.toolBtn} onClick={addRect}>
            + Kotak warna
          </button>
        </div>

        <div style={styles.sideSection}>
          <div style={styles.sideLabel}>Latar halaman</div>
          <label style={styles.colorRow}>
            <span>Warna latar</span>
            <input
              type="color"
              value={active?.bg || "#ffffff"}
              onChange={(e) =>
                updatePage(activeIdx, (p) => ({ ...p, bg: e.target.value }))
              }
            />
          </label>
        </div>

        <div style={styles.sideSection}>
          <div style={styles.sideLabel}>Halaman ({pages.length})</div>
          <div style={styles.pageList}>
            {pages.map((p, i) => (
              <div
                key={p.id}
                style={{
                  ...styles.pageThumb,
                  outline:
                    i === activeIdx ? "2px solid var(--ochre)" : "1px solid var(--line)",
                }}
                onClick={() => {
                  setActiveIdx(i);
                  setSelectedId(null);
                }}
              >
                <span>{i + 1}</span>
                {pages.length > 1 && (
                  <button
                    style={styles.pageDelete}
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePage(i);
                    }}
                    title="Hapus halaman"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button style={styles.addPageBtn} onClick={addPage}>
              + Halaman
            </button>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <button
          style={styles.exportBtn}
          onClick={exportPdf}
          disabled={exporting}
        >
          {exporting ? "Menyusun PDF…" : "Unduh sebagai PDF"}
        </button>
        <p style={styles.hint}>
          Semua diproses di browser kamu — tidak ada yang diunggah ke server.
        </p>
      </aside>

      {/* Canvas */}
      <main style={styles.canvasArea} onPointerDown={() => setSelectedId(null)}>
        <div
          ref={pageRef}
          style={{
            ...styles.page,
            background: active?.bg || "#ffffff",
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {active?.elements.map((el) => (
            <ElementView
              key={el.id}
              el={el}
              selected={el.id === selectedId}
              editing={el.id === editingId}
              onSelect={() => setSelectedId(el.id)}
              onPointerDownMove={(e) => onPointerDownEl(e, el, "move")}
              onPointerDownResize={(e) => onPointerDownEl(e, el, "resize")}
              onStartEdit={() => setEditingId(el.id)}
              onStopEdit={(text) => {
                setEditingId(null);
                if (el.kind === "text") updateElement(el.id, { text });
              }}
            />
          ))}
        </div>
      </main>

      {/* Right property panel */}
      {selected && (
        <aside style={styles.propsPanel} className="scrollbar-thin">
          <div style={styles.sideLabel}>Properti</div>

          {selected.kind === "text" && (
            <TextProps
              el={selected}
              onChange={(patch) => updateElement(selected.id, patch)}
            />
          )}
          {selected.kind === "rect" && (
            <RectProps
              el={selected}
              onChange={(patch) => updateElement(selected.id, patch)}
            />
          )}
          {selected.kind === "image" && (
            <div style={styles.hint}>Seret sudut untuk mengubah ukuran gambar.</div>
          )}

          <div style={styles.propsActions}>
            <button style={styles.toolBtnSmall} onClick={duplicateSelected}>
              Duplikat
            </button>
            <button
              style={{ ...styles.toolBtnSmall, color: "var(--danger)" }}
              onClick={deleteSelected}
            >
              Hapus
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

/* ---------- Element rendering ---------- */

function ElementView({
  el,
  selected,
  editing,
  onSelect,
  onPointerDownMove,
  onPointerDownResize,
  onStartEdit,
  onStopEdit,
}: {
  el: ElementData;
  selected: boolean;
  editing: boolean;
  onSelect: () => void;
  onPointerDownMove: (e: React.PointerEvent) => void;
  onPointerDownResize: (e: React.PointerEvent) => void;
  onStartEdit: () => void;
  onStopEdit: (text: string) => void;
}) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && textRef.current) {
      textRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editing]);

  const box: React.CSSProperties = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
    outline: selected ? "1.5px solid var(--ochre)" : "1px solid transparent",
    cursor: editing ? "text" : "move",
    userSelect: editing ? "text" : "none",
  };

  return (
    <div
      style={box}
      onPointerDown={(e) => {
        onSelect();
        if (!editing) onPointerDownMove(e);
      }}
      onDoubleClick={() => el.kind === "text" && onStartEdit()}
    >
      {el.kind === "text" && (
        <div
          ref={textRef}
          contentEditable={editing}
          suppressContentEditableWarning
          onBlur={(e) => onStopEdit(e.currentTarget.innerText)}
          style={{
            width: "100%",
            height: "100%",
            fontSize: el.fontSize,
            fontFamily:
              el.fontFamily === "Fraunces"
                ? "'Fraunces', serif"
                : el.fontFamily === "Georgia"
                ? "Georgia, serif"
                : "'Space Grotesk', sans-serif",
            color: el.color,
            fontWeight: el.bold ? 700 : 400,
            fontStyle: el.italic ? "italic" : "normal",
            textAlign: el.align,
            outline: "none",
            lineHeight: 1.3,
            overflowWrap: "break-word",
            padding: 2,
          }}
        >
          {el.text}
        </div>
      )}

      {el.kind === "rect" && (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: el.fill,
            borderRadius: el.radius,
          }}
        />
      )}

      {el.kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={el.src}
          alt=""
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
        />
      )}

      {selected && !editing && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            onPointerDownResize(e);
          }}
          style={{
            position: "absolute",
            right: -6,
            bottom: -6,
            width: 14,
            height: 14,
            borderRadius: 4,
            background: "var(--ochre)",
            cursor: "nwse-resize",
          }}
        />
      )}
    </div>
  );
}

/* ---------- Property editors ---------- */

function TextProps({
  el,
  onChange,
}: {
  el: TextEl;
  onChange: (p: Partial<TextEl>) => void;
}) {
  return (
    <div style={styles.propGroup}>
      <label style={styles.propLabel}>
        Font
        <select
          value={el.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value as TextEl["fontFamily"] })}
          style={styles.select}
        >
          <option value="Space Grotesk">Space Grotesk</option>
          <option value="Fraunces">Fraunces (serif)</option>
          <option value="Georgia">Georgia</option>
        </select>
      </label>

      <label style={styles.propLabel}>
        Ukuran
        <input
          type="number"
          min={8}
          max={140}
          value={el.fontSize}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
          style={styles.numInput}
        />
      </label>

      <label style={styles.colorRow}>
        <span>Warna teks</span>
        <input
          type="color"
          value={el.color}
          onChange={(e) => onChange({ color: e.target.value })}
        />
      </label>

      <div style={styles.rowBtns}>
        <button
          style={{ ...styles.toggleBtn, background: el.bold ? "var(--ochre)" : undefined }}
          onClick={() => onChange({ bold: !el.bold })}
        >
          B
        </button>
        <button
          style={{ ...styles.toggleBtn, background: el.italic ? "var(--ochre)" : undefined }}
          onClick={() => onChange({ italic: !el.italic })}
        >
          I
        </button>
        {(["left", "center", "right"] as const).map((a) => (
          <button
            key={a}
            style={{ ...styles.toggleBtn, background: el.align === a ? "var(--ochre)" : undefined }}
            onClick={() => onChange({ align: a })}
          >
            {a === "left" ? "⟸" : a === "center" ? "≡" : "⟹"}
          </button>
        ))}
      </div>
      <p style={styles.hint}>Klik dua kali pada teks di kanvas untuk mengetik.</p>
    </div>
  );
}

function RectProps({
  el,
  onChange,
}: {
  el: RectEl;
  onChange: (p: Partial<RectEl>) => void;
}) {
  return (
    <div style={styles.propGroup}>
      <label style={styles.colorRow}>
        <span>Warna isi</span>
        <input
          type="color"
          value={el.fill}
          onChange={(e) => onChange({ fill: e.target.value })}
        />
      </label>
      <label style={styles.propLabel}>
        Lengkung sudut
        <input
          type="range"
          min={0}
          max={80}
          value={el.radius}
          onChange={(e) => onChange({ radius: Number(e.target.value) })}
        />
      </label>
    </div>
  );
}

/* ---------- Styles ---------- */

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
  },
  sidebar: {
    width: 240,
    flexShrink: 0,
    background: "var(--panel)",
    borderRight: "1px solid var(--line)",
    padding: "18px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 22,
    overflowY: "auto",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: "var(--ochre)",
    color: "#14171c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-display)",
    fontWeight: 700,
  },
  brandName: {
    fontFamily: "var(--font-display)",
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: 0.2,
  },
  sideSection: { display: "flex", flexDirection: "column", gap: 8 },
  sideLabel: {
    fontSize: 12,
    textTransform: "none",
    color: "var(--muted)",
    marginBottom: 2,
  },
  toolBtn: {
    background: "var(--panel-2)",
    color: "var(--cream)",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius)",
    padding: "10px 12px",
    textAlign: "left",
    fontSize: 14,
  },
  toolBtnSmall: {
    background: "var(--panel-2)",
    color: "var(--cream)",
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    flex: 1,
  },
  colorRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 13,
    color: "var(--cream)",
  },
  pageList: { display: "flex", flexWrap: "wrap", gap: 8 },
  pageThumb: {
    position: "relative",
    width: 42,
    height: 56,
    borderRadius: 4,
    background: "#fff",
    color: "#14171c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    cursor: "pointer",
  },
  pageDelete: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: "50%",
    background: "var(--danger)",
    color: "#fff",
    border: "none",
    fontSize: 11,
    lineHeight: "16px",
    padding: 0,
  },
  addPageBtn: {
    width: 42,
    height: 56,
    borderRadius: 4,
    border: "1px dashed var(--line)",
    background: "transparent",
    color: "var(--muted)",
    fontSize: 18,
  },
  exportBtn: {
    background: "var(--ochre)",
    color: "#14171c",
    border: "none",
    borderRadius: "var(--radius)",
    padding: "13px 14px",
    fontWeight: 600,
    fontSize: 14,
  },
  hint: { fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5, margin: 0 },
  canvasArea: {
    flex: 1,
    background: "var(--paper-area)",
    overflow: "auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "48px 24px",
  },
  page: {
    width: PAGE_W,
    height: PAGE_H,
    position: "relative",
    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
    flexShrink: 0,
    overflow: "hidden",
  },
  propsPanel: {
    width: 240,
    flexShrink: 0,
    background: "var(--panel)",
    borderLeft: "1px solid var(--line)",
    padding: "18px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    overflowY: "auto",
  },
  propGroup: { display: "flex", flexDirection: "column", gap: 12 },
  propLabel: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 12,
    color: "var(--muted)",
  },
  select: {
    background: "var(--panel-2)",
    color: "var(--cream)",
    border: "1px solid var(--line)",
    borderRadius: 6,
    padding: "6px 8px",
  },
  numInput: {
    background: "var(--panel-2)",
    color: "var(--cream)",
    border: "1px solid var(--line)",
    borderRadius: 6,
    padding: "6px 8px",
    width: "100%",
  },
  rowBtns: { display: "flex", gap: 6 },
  toggleBtn: {
    flex: 1,
    background: "var(--panel-2)",
    color: "var(--cream)",
    border: "1px solid var(--line)",
    borderRadius: 6,
    padding: "6px 0",
    fontWeight: 700,
  },
  propsActions: { display: "flex", gap: 8, marginTop: 8 },
};
