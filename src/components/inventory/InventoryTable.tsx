import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { KitchenTone } from "@/lib/inventoryNav";
import { api } from "@/lib/api";
import { IngredientWizard } from "./IngredientWizard";

interface RowData {
  _id: string;
  code: string;
  name: string;
  quantity: string;
  unit: string;
  note: string;
  supplier: string;
  subType: string;
}

interface InventoryTableProps {
  id: string;
  label: string;
  emoji: string;
  tone: KitchenTone;
}

type EditableField = "name" | "quantity" | "unit" | "note" | "supplier" | "subType";

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

function rowToApi(r: RowData, spaceId: string) {
  return {
    id: r._id, space_id: spaceId, code: r.code, name: r.name,
    quantity: parseFloat(r.quantity) || 0, unit: r.unit,
    note: r.note, supplier: r.supplier, sub_type: r.subType,
  };
}

function apiToRow(r: any): RowData {
  return {
    _id: r.id, code: r.code, name: r.name,
    quantity: String(r.quantity), unit: r.unit,
    note: r.note || "", supplier: r.supplier || "", subType: r.sub_type || "",
  };
}

// Visible columns: TÊN (wide, with sub-text), SL, ĐVT, GHI CHÚ
const GRID_COLS = "1fr 0.45fr 0.4fr 0.55fr 20px";
const HEADER_LABELS = ["TÊN", "SL", "ĐVT", "GHI CHÚ"];

export function InventoryTable({ id, label, emoji, tone }: InventoryTableProps) {
  const [rows, setRows] = useState<RowData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [wizardMode, setWizardMode] = useState<"hidden" | "peek" | "full">("hidden");
  const [wizardKey, setWizardKey] = useState(0);
  const [activeCell, setActiveCell] = useState<{ rowId: string; field: EditableField } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.getInventory(id).then(data => {
      if (data.length > 0) setRows(data.map(apiToRow));
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [id]);

  useEffect(() => {
    if (!loaded) return;
    setWizardMode(cur => {
      if (cur === "full") return cur;
      return rows.length === 0 ? "full" : "peek";
    });
  }, [loaded, rows.length]);

  const persistRows = useCallback((nextRows: RowData[]) => {
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
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
      if (nearBottom) setWizardMode(cur => cur === "peek" ? "full" : cur);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const updateField = useCallback((rowId: string, field: EditableField, value: string) => {
    setRows(prev => {
      const next = prev.map(r => r._id === rowId ? { ...r, [field]: value } : r);
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
    const newRow: RowData = {
      _id: `${id}-${Date.now()}`,
      code,
      name: data.name,
      quantity: data.quantity || "0",
      unit: data.unit,
      note: data.note || "Mới nhập",
      supplier: "",
      subType: "",
    };
    setRows(prev => {
      const next = [newRow, ...prev];
      persistRows(next);
      return next;
    });
    setWizardKey(k => k + 1);
    setWizardMode("peek");
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
  }, [id, rows.length, persistRows]);

  if (!loaded) {
    return <div className="relative h-full w-full"><InventoryTableSkeleton label={label} emoji={emoji} /></div>;
  }

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
          <button onClick={() => setWizardMode("full")}
            className="rounded-full bg-secondary text-secondary-foreground px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider shadow-sm transition-transform active:scale-95">
            + THÊM
          </button>
        </div>
      </div>

      {/* Table + wizard */}
      <div className="relative flex-1 min-h-0">
        <div ref={scrollRef} className="absolute inset-0 overflow-y-auto overscroll-contain scrollbar-hide" style={{ touchAction: "pan-y" }}>
          {/* Column headers */}
          <div
            className={`sticky top-0 z-10 grid gap-1.5 border-b border-border/40 bg-card/80 backdrop-blur px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-widest text-muted-foreground transition-shadow ${scrolled ? "shadow-sm" : ""}`}
            style={{ gridTemplateColumns: GRID_COLS }}
          >
            {HEADER_LABELS.map(c => <div key={c} className="truncate">{c}</div>)}
            <div />
          </div>

          {/* Rows */}
          <div>
            {rows.map(r => (
              <InventoryRow
                key={r._id}
                row={r}
                activeCell={activeCell}
                onActivate={(field) => setActiveCell({ rowId: r._id, field })}
                onUpdate={(field, value) => { updateField(r._id, field, value); setActiveCell(null); }}
                onCancelEdit={() => setActiveCell(null)}
                onDelete={() => deleteRow(r._id)}
              />
            ))}
            <div className="px-3 py-4 text-center font-mono text-[9px] text-muted-foreground">
              {rows.length === 0 ? "— trống · nhấn + THÊM —" : "— nhấn ô bất kỳ để sửa —"}
            </div>
          </div>
        </div>

        {/* Wizard overlay */}
        <div
          className="absolute inset-0 z-20 transition-all duration-500 ease-out"
          style={{
            transform: wizardMode === "full" ? "translateY(0)" : "translateY(50%)",
            opacity: wizardMode === "full" ? 1 : 0.55,
            pointerEvents: wizardMode === "full" ? "auto" : "none",
          }}
        >
          {wizardMode === "peek" && (
            <>
              <div className="absolute inset-0 z-30 pointer-events-auto cursor-pointer"
                style={{ background: "linear-gradient(to bottom, hsla(220,25%,10%,0.6) 0%, transparent 100%)" }}
                onClick={() => setWizardMode("full")}
                onTouchStart={(e) => {
                  const startY = e.touches[0].clientY;
                  const onMove = (ev: TouchEvent) => {
                    if (startY - ev.touches[0].clientY > 30) { setWizardMode("full"); document.removeEventListener("touchmove", onMove); }
                  };
                  document.addEventListener("touchmove", onMove, { passive: true });
                  document.addEventListener("touchend", () => document.removeEventListener("touchmove", onMove), { once: true });
                }}
              />
              <button onClick={() => setWizardMode("full")}
                className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 pointer-events-auto px-5 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-1.5">
                <span className="text-sm">+</span> Thêm nguyên liệu
              </button>
            </>
          )}
          <IngredientWizard key={wizardKey} spaceId={id} onSelect={addFromWizard}
            onCancel={() => setWizardMode(rows.length === 0 ? "full" : "peek")} />
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

/* ─── Row Component ─── */

function InventoryRow({ row, activeCell, onActivate, onUpdate, onCancelEdit, onDelete }: {
  row: RowData;
  activeCell: { rowId: string; field: EditableField } | null;
  onActivate: (field: EditableField) => void;
  onUpdate: (field: EditableField, value: string) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const isEditing = (field: EditableField) => activeCell?.rowId === row._id && activeCell.field === field;

  // Sub-text: show supplier (teal) or subType (amber), whichever exists
  const subText = row.supplier || row.subType || null;
  const subTextColor = row.supplier ? "text-teal-400" : "text-amber-400";
  const subTextLabel = row.supplier ? row.supplier : row.subType;

  return (
    <div
      className="grid items-center gap-1.5 border-b border-border/20 px-3 py-2.5 font-mono text-[12px] leading-snug transition-colors hover:bg-muted/30"
      style={{ gridTemplateColumns: GRID_COLS, minHeight: 48 } as CSSProperties}
    >
      {/* NAME — wide column with sub-text */}
      <div className="min-w-0">
        {isEditing("name") ? (
          <CellInput value={row.name} onCommit={v => onUpdate("name", v)} onCancel={onCancelEdit} />
        ) : (
          <button type="button" onClick={() => onActivate("name")}
            className="w-full text-left rounded-md px-1 py-0.5 transition-colors hover:bg-primary/10">
            <span className="text-foreground font-semibold block truncate">{row.name}</span>
            {subText && (
              <span className={`text-[9px] font-semibold block truncate ${subTextColor}`}>
                {subTextLabel}
              </span>
            )}
          </button>
        )}
      </div>

      {/* QUANTITY */}
      {isEditing("quantity") ? (
        <CellInput value={row.quantity} onCommit={v => onUpdate("quantity", v)} onCancel={onCancelEdit} inputMode="decimal" />
      ) : (
        <button type="button" onClick={() => onActivate("quantity")}
          className="truncate text-left rounded-md px-1 py-0.5 transition-colors hover:bg-primary/10">
          <span className="text-accent tabular-nums font-semibold">{row.quantity}</span>
        </button>
      )}

      {/* UNIT */}
      {isEditing("unit") ? (
        <CellInput value={row.unit} onCommit={v => onUpdate("unit", v)} onCancel={onCancelEdit} />
      ) : (
        <button type="button" onClick={() => onActivate("unit")}
          className="truncate text-left rounded-md px-1 py-0.5 transition-colors hover:bg-primary/10">
          <span className="text-muted-foreground">{row.unit}</span>
        </button>
      )}

      {/* STATUS */}
      {isEditing("note") ? (
        <StatusSelect value={row.note} onCommit={v => onUpdate("note", v)} onCancel={onCancelEdit} />
      ) : (
        <button type="button" onClick={() => onActivate("note")} className="text-left">
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide ${STATUS_STYLES[row.note] ?? "bg-muted text-muted-foreground border-border"}`}>
            {row.note || "—"}
          </span>
        </button>
      )}

      {/* DELETE */}
      <button onClick={onDelete}
        className="flex h-5 w-5 items-center justify-center rounded-md border border-destructive/40 bg-destructive/15 text-[12px] font-bold leading-none text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground">
        ×
      </button>
    </div>
  );
}

/* ─── Cell Inputs ─── */

function CellInput({ value, onCommit, onCancel, inputMode }: {
  value: string; onCommit: (v: string) => void; onCancel: () => void; inputMode?: string;
}) {
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);

  return (
    <input ref={ref} value={draft}
      inputMode={inputMode as any}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={e => { if (e.key === "Enter") onCommit(draft); if (e.key === "Escape") onCancel(); }}
      className="w-full rounded-md border border-primary/60 bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-foreground outline-none ring-2 ring-primary/40" />
  );
}

function StatusSelect({ value, onCommit, onCancel }: {
  value: string; onCommit: (v: string) => void; onCancel: () => void;
}) {
  const ref = useRef<HTMLSelectElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <select ref={ref} value={value}
      onChange={e => onCommit(e.target.value)}
      onBlur={() => onCommit(value)}
      onKeyDown={e => { if (e.key === "Escape") onCancel(); }}
      className="w-full rounded-md border border-primary/60 bg-primary/10 px-1 py-0.5 font-mono text-[10px] text-foreground outline-none ring-2 ring-primary/40">
      {STATUSES.map(s => <option key={s} value={s} className="bg-card text-foreground">{s}</option>)}
    </select>
  );
}

/* ─── Skeleton ─── */

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
          <div key={i} className="grid grid-cols-4 gap-2 border-b border-border/20 py-2.5">
            {[0, 1, 2, 3].map(c => (
              <div key={c} className="h-2 rounded-full bg-muted animate-pulse" style={{ width: `${50 + ((i * 13 + c * 7) % 50)}%`, animationDelay: `${(i * 80 + c * 40) % 800}ms` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
