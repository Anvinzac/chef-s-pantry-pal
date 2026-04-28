import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { KitchenTone } from "@/lib/inventoryNav";
import { api } from "@/lib/api";
import { IngredientWizard } from "./IngredientWizard";

type Row = Record<(typeof COLUMNS)[number], string> & { _id: string };

interface InventoryTableProps {
  id: string;
  label: string;
  emoji: string;
  tone: KitchenTone;
  onRequestWizard?: () => void;
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

export function InventoryTable({ id, label, emoji, tone, onRequestWizard }: InventoryTableProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [wizardMode, setWizardMode] = useState<"hidden" | "peek" | "full">("hidden");
  const [wizardKey, setWizardKey] = useState(0);
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

  // Wizard visibility is now uniform across all cells:
  //  • Empty cells start in "full" mode — the wizard takes over so the user
  //    immediately enters add-new-item flow.
  //  • Cells with rows show the wizard as a faded peek at the bottom half;
  //    tap or swipe-up promotes it to "full".
  // The wizard is never fully hidden — it's always discoverable.
  useEffect(() => {
    if (!loaded) return;
    setWizardMode((cur) => {
      // Don't override an active "full" promotion the user opened manually.
      if (cur === "full") return cur;
      return rows.length === 0 ? "full" : "peek";
    });
  }, [loaded, rows.length]);

  const persistRows = useCallback((nextRows: Row[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.saveInventory(id, nextRows.map(r => rowToApi(r, id))).catch(() => {});
    }, 500);
  }, [id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      setScrolled(el.scrollTop > 4);
      // Promote peek → full when the user scrolls to (or past) the bottom
      // of the table content. The peek wizard is overlaying the bottom half,
      // so reaching the bottom signals intent to interact with it.
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
      if (nearBottom) {
        setWizardMode((cur) => (cur === "peek" ? "full" : cur));
      }
    };
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

  const addFromWizard = useCallback((data: { name: string; emoji: string; unit: string; quantity: string; note: string }) => {
    const code = `${id}-${String(rows.length + 1).padStart(3, "0")}`;
    const newRow: Row = {
      _id: `${id}-${Date.now()}`,
      "MÃ": code,
      "TÊN": data.name,
      "SL": data.quantity || "0",
      "ĐVT": data.unit,
      "GHI CHÚ": data.note || "Mới nhập",
    };
    setRows(prev => {
      const next = [newRow, ...prev];
      persistRows(next);
      return next;
    });
    // After adding: reset the wizard component (clear category/picked) and
    // collapse it back to the bottom-half peek so the user can keep adding.
    setWizardKey(k => k + 1);
    setWizardMode("peek");
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
  }, [id, rows.length, persistRows]);

  const gridCols = "0.7fr 1.4fr 0.6fr 0.6fr 0.8fr 24px";

  if (!loaded) {
    return <div className="relative h-full w-full"><InventoryTableSkeleton label={label} emoji={emoji} /></div>;
  }

  // Empty cells fall through to the standard layout. The wizard is rendered
  // as an absolutely-positioned overlay (peek/full) below, so it appears in
  // the same visual slot whether the table has rows or not.

  return (
    <div className="absolute inset-0 flex flex-col bg-card text-foreground rounded-xl overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${TONE_ACCENT[tone]} pointer-events-none z-0`} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-border/50 px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <div className={`h-2 w-2 rounded-full ${TONE_DOT[tone]}`} />
          <span className="font-extrabold text-sm leading-none tracking-tight">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{rows.length} dòng</span>
          <button
            onClick={() => setWizardMode("full")}
            className="rounded-full bg-secondary text-secondary-foreground px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider shadow-sm transition-transform active:scale-95"
          >
            + THÊM
          </button>
        </div>
      </div>

      {/* Table + wizard peek container */}
      <div className="relative flex-1 min-h-0">
        {/* Scrollable table */}
        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto overscroll-contain scrollbar-hide"
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
                    return <CellInput key={c} column={c} value={r[c]}
                      onCommit={v => { updateCell(r._id, c, v); setActiveCell(null); }}
                      onCancel={() => setActiveCell(null)} />;
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
                  const display = c === "MÃ" ? <span className="text-primary/80">{r[c]}</span>
                    : c === "SL" ? <span className="text-accent tabular-nums font-semibold">{r[c]}</span>
                    : c === "ĐVT" ? <span className="text-muted-foreground">{r[c]}</span>
                    : <span className="text-foreground">{r[c]}</span>;
                  return (
                    <button key={c} type="button" onClick={() => setActiveCell({ rowId: r._id, col: c })}
                      className="truncate text-left font-mono rounded-md px-1 py-0.5 transition-colors hover:bg-primary/10 hover:text-primary">
                      {display}
                    </button>
                  );
                })}
                <button onClick={() => deleteRow(r._id)}
                  className="flex h-5 w-5 items-center justify-center rounded-md border border-destructive/40 bg-destructive/15 text-[12px] font-bold leading-none text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground">
                  ×
                </button>
              </div>
            ))}
            <div className="px-3 py-4 text-center font-mono text-[9px] text-muted-foreground">
              {rows.length === 0 ? "— trống · nhấn + THÊM —" : "— nhấn ô bất kỳ để sửa —"}
            </div>
          </div>
        </div>

        {/* Wizard overlay — always rendered. Peek = bottom half + faded.
            Full = covers the cell. Tap or swipe-up promotes peek → full. */}
        <div
          className="absolute inset-0 z-20 transition-all duration-500 ease-out"
          style={{
            transform: wizardMode === "full" ? "translateY(0)" : "translateY(50%)",
            opacity: wizardMode === "full" ? 1 : 0.55,
            pointerEvents: wizardMode === "full" ? "auto" : "none",
          }}
        >
          {/* Peek mode: tap/swipe-up surface above the faded wizard */}
          {wizardMode === "peek" && (
            <>
              <div
                className="absolute inset-0 z-30 pointer-events-auto cursor-pointer"
                style={{
                  background: "linear-gradient(to bottom, hsla(220,25%,10%,0.6) 0%, transparent 100%)",
                }}
                onClick={() => setWizardMode("full")}
                onTouchStart={(e) => {
                  const startY = e.touches[0].clientY;
                  const onMove = (ev: TouchEvent) => {
                    if (startY - ev.touches[0].clientY > 30) {
                      setWizardMode("full");
                      document.removeEventListener("touchmove", onMove);
                    }
                  };
                  document.addEventListener("touchmove", onMove, { passive: true });
                  document.addEventListener("touchend", () => document.removeEventListener("touchmove", onMove), { once: true });
                }}
              />
              {/* Add button floating above the peek */}
              <button
                onClick={() => setWizardMode("full")}
                className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 pointer-events-auto px-5 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <span className="text-sm">+</span> Thêm nguyên liệu
              </button>
            </>
          )}
          <IngredientWizard
            key={wizardKey}
            spaceId={id}
            onSelect={addFromWizard}
            onCancel={() => setWizardMode(rows.length === 0 ? "full" : "peek")}
          />
        </div>
      </div>

      {/* Bottom strip */}
      <div className="relative z-10 flex items-center justify-between border-t border-border/50 bg-card/80 backdrop-blur px-3.5 py-1.5 font-mono text-[9px]">
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
