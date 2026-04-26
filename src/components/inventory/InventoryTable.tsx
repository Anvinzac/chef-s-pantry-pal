import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { KitchenTone } from "@/lib/inventoryNav";
import { api } from "@/lib/api";
import { IngredientWizard } from "./IngredientWizard";

type Row = Record<(typeof COLUMNS)[number], string> & { _id: string };

interface InventoryTableProps {
  id: string;
  label: string;
  emoji: string;
  tone: KitchenTone;
}

const COLUMNS = ["MÃ", "TÊN", "SL", "ĐVT", "GHI CHÚ"] as const;
const STATUSES = ["Đủ", "Sắp hết", "Hết", "Mới nhập"];

const STATUS_STYLES: Record<string, string> = {
  "Đủ": "bg-green-500/15 text-green-400 border-green-500/30",
  "Sắp hết": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "Hết": "bg-red-500/15 text-red-400 border-red-500/30",
  "Mới nhập": "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const TONE_ACCENT: Record<KitchenTone, string> = {
  primary: "from-primary/20 via-primary/5 to-transparent",
  accent: "from-secondary/20 via-secondary/5 to-transparent",
  signal: "from-accent/20 via-accent/5 to-transparent",
  muted: "from-muted/30 via-muted/10 to-transparent",
};

const TONE_DOT: Record<KitchenTone, string> = {
  primary: "bg-primary",
  accent: "bg-secondary",
  signal: "bg-accent",
  muted: "bg-muted-foreground",
};

function rowToApi(r: Row, spaceId: string) {
  return { id: r._id, space_id: spaceId, code: r["MÃ"], name: r["TÊN"], quantity: parseFloat(r["SL"]) || 0, unit: r["ĐVT"], note: r["GHI CHÚ"] };
}

function apiToRow(r: any): Row {
  return { _id: r.id, "MÃ": r.code, "TÊN": r.name, "SL": String(r.quantity), "ĐVT": r.unit, "GHI CHÚ": r.note || "" };
}

export function InventoryTable({ id, label, emoji, tone }: InventoryTableProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [activeCell, setActiveCell] = useState<{ rowId: string; col: (typeof COLUMNS)[number] } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.getInventory(id).then(data => {
      if (data.length > 0) setRows(data.map(apiToRow));
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [id]);

  const persistRows = useCallback((nextRows: Row[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.saveInventory(id, nextRows.map(r => rowToApi(r, id))).catch(() => {});
    }, 500);
  }, [id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 4);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const updateCell = useCallback((rowId: string, col: (typeof COLUMNS)[number], value: string) => {
    setRows(prev => {
      const next = prev.map(r => r._id === rowId ? { ...r, [col]: value } : r);
      persistRows(next);
      return next;
    });
  }, [persistRows]);

  const deleteRow = useCallback((rowId: string) => {
    setRows(prev => {
      const next = prev.filter(r => r._id !== rowId);
      persistRows(next);
      api.deleteInventoryRow(rowId).catch(() => {});
      return next;
    });
  }, [persistRows]);

  const addFromWizard = useCallback((ing: { id: string; name: string; emoji: string; unit: string }) => {
    const code = `${id}-${String(rows.length + 1).padStart(3, "0")}`;
    const newRow: Row = {
      _id: `${id}-${ing.id}-${Date.now()}`,
      "MÃ": code,
      "TÊN": ing.name,
      "SL": "0",
      "ĐVT": ing.unit,
      "GHI CHÚ": "Mới nhập",
    };
    setRows(prev => {
      const next = [newRow, ...prev];
      persistRows(next);
      return next;
    });
    setShowWizard(false);
    setActiveCell({ rowId: newRow._id, col: "SL" });
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
  }, [id, rows.length, persistRows]);

  const gridCols = "0.7fr 1.4fr 0.6fr 0.6fr 0.8fr 24px";

  if (!loaded) {
    return (
      <div className="relative h-full w-full">
        <InventoryTableSkeleton label={label} emoji={emoji} />
      </div>
    );
  }

  // Show wizard when table is empty or user tapped add
  if (showWizard || (loaded && rows.length === 0)) {
    return (
      <div className="relative h-full w-full">
        <IngredientWizard
          spaceId={id}
          onSelect={addFromWizard}
          onCancel={() => setShowWizard(false)}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-card text-foreground rounded-xl overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${TONE_ACCENT[tone]} pointer-events-none`} />

      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-border/50 px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <div className={`h-2 w-2 rounded-full ${TONE_DOT[tone]}`} />
          <span className="font-extrabold text-sm leading-none tracking-tight">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{rows.length} dòng</span>
          <button
            onClick={() => setShowWizard(true)}
            className="rounded-full bg-secondary text-secondary-foreground px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider shadow-sm transition-transform active:scale-95"
          >
            + THÊM
          </button>
        </div>
      </div>

      {/* Scrollable table */}
      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto overscroll-contain scrollbar-hide"
        style={{ touchAction: "pan-y" }}
      >
        <div
          className={`sticky top-0 z-10 grid gap-2 border-b border-border/40 bg-card/80 backdrop-blur px-3 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-shadow ${scrolled ? "shadow-sm" : ""}`}
          style={{ gridTemplateColumns: gridCols }}
        >
          {COLUMNS.map(c => <div key={c} className="truncate">{c}</div>)}
          <div />
        </div>

        <div>
          {rows.map(r => (
            <div
              key={r._id}
              className="grid items-center gap-2 border-b border-border/20 px-3 py-3 font-mono text-[12px] leading-snug transition-colors hover:bg-muted/30"
              style={{ gridTemplateColumns: gridCols, minHeight: 44 } as CSSProperties}
            >
              {COLUMNS.map(c => {
                const isActive = activeCell?.rowId === r._id && activeCell.col === c;

                if (isActive) {
                  return (
                    <CellInput
                      key={c}
                      column={c}
                      value={r[c]}
                      onCommit={v => { updateCell(r._id, c, v); setActiveCell(null); }}
                      onCancel={() => setActiveCell(null)}
                    />
                  );
                }

                if (c === "GHI CHÚ") {
                  return (
                    <button key={c} type="button" onClick={() => setActiveCell({ rowId: r._id, col: c })} className="text-left">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${STATUS_STYLES[r[c]] ?? "bg-muted text-muted-foreground border-border"}`}>
                        {r[c] || "—"}
                      </span>
                    </button>
                  );
                }

                const display = c === "MÃ"
                  ? <span className="text-primary/80">{r[c]}</span>
                  : c === "SL"
                    ? <span className="text-accent tabular-nums font-semibold">{r[c]}</span>
                    : c === "ĐVT"
                      ? <span className="text-muted-foreground">{r[c]}</span>
                      : <span className="text-foreground">{r[c]}</span>;

                return (
                  <button
                    key={c} type="button"
                    onClick={() => setActiveCell({ rowId: r._id, col: c })}
                    className="truncate text-left font-mono rounded-md px-1 py-0.5 transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    {display}
                  </button>
                );
              })}
              <button
                onClick={() => deleteRow(r._id)}
                className="flex h-5 w-5 items-center justify-center rounded-md border border-destructive/40 bg-destructive/15 text-[12px] font-bold leading-none text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
              >
                ×
              </button>
            </div>
          ))}
          <div className="px-3 py-4 text-center font-mono text-[9px] text-muted-foreground">
            — nhấn ô bất kỳ để sửa —
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/50 bg-card/80 backdrop-blur px-3.5 py-1.5 font-mono text-[9px]">
        <span className="text-muted-foreground">{emoji} {label}</span>
        <span className="text-muted-foreground">SẴN SÀNG</span>
      </div>
    </div>
  );
}

function InventoryTableSkeleton({ label, emoji }: { label: string; emoji: string }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-card text-foreground rounded-xl overflow-hidden">
      <div className="relative flex items-center justify-between border-b border-border/50 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
          <span className="font-extrabold text-sm leading-none text-muted-foreground">{label}</span>
        </div>
        <span className="font-mono text-[9px] text-muted-foreground">ĐANG TẢI...</span>
      </div>
      <div className="flex-1 overflow-hidden px-3 py-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-2 border-b border-border/20 py-2.5">
            {[0, 1, 2, 3, 4].map(c => (
              <div key={c} className="h-2 rounded-full bg-muted animate-pulse" style={{ width: `${50 + ((i * 13 + c * 7) % 50)}%`, animationDelay: `${(i * 80 + c * 40) % 800}ms` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CellInput({
  column, value, onCommit, onCancel,
}: {
  column: (typeof COLUMNS)[number]; value: string;
  onCommit: (v: string) => void; onCancel: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) { el.focus(); if ("select" in el && typeof el.select === "function") el.select(); }
  }, []);

  const baseInput = "w-full rounded-md border border-primary/60 bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-foreground outline-none ring-2 ring-primary/40";

  if (column === "GHI CHÚ") {
    return (
      <select ref={ref as React.RefObject<HTMLSelectElement>} value={draft}
        onChange={e => { setDraft(e.target.value); onCommit(e.target.value); }}
        onBlur={() => onCommit(draft)} onKeyDown={e => { if (e.key === "Escape") onCancel(); }}
        className={baseInput}>
        {STATUSES.map(s => <option key={s} value={s} className="bg-card text-foreground">{s}</option>)}
      </select>
    );
  }

  return (
    <input ref={ref as React.RefObject<HTMLInputElement>} value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={e => { if (e.key === "Enter") onCommit(draft); if (e.key === "Escape") onCancel(); }}
      className={baseInput} />
  );
}
