import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryEdgeButtons } from "@/components/inventory/InventoryEdgeButtons";
import { InventoryKnob, type InventoryKnobHandle } from "@/components/inventory/InventoryKnob";
import type { Direction, GridCell } from "@/lib/inventoryNav";
import { CELL_TO_DIRECTION, KITCHEN_SPACES, moveCell } from "@/lib/inventoryNav";
import { ChevronLeft } from "lucide-react";

const EDGE = 5;
const KNOB_CLEARANCE = "calc(56px + env(safe-area-inset-bottom, 0px))";
const KNOB_OFFSET = "calc(8px + env(safe-area-inset-bottom, 0px))";

type Diagonal = "ne" | "nw" | "se" | "sw";
const isDiagonal = (d: Exclude<Direction, "center"> | null): d is Diagonal =>
  d === "ne" || d === "nw" || d === "se" || d === "sw";

const Inventory = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState<GridCell>({ row: 1, col: 1 });
  const [mounted, setMounted] = useState<Set<string>>(() => new Set(["1-1"]));
  const [armedDiagonal, setArmedDiagonal] = useState<Diagonal | null>(null);
  const [overview, setOverview] = useState(false);
  const knobRef = useRef<InventoryKnobHandle>(null);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setMounted((prev) => {
        const next = new Set(prev);
        [
          { row: 0, col: 1 }, { row: 2, col: 1 },
          { row: 1, col: 0 }, { row: 1, col: 2 },
        ].forEach((c) => next.add(`${c.row}-${c.col}`));
        return next;
      });
    }, 400);
    const t2 = setTimeout(() => {
      setMounted((prev) => {
        const next = new Set(prev);
        KITCHEN_SPACES.forEach((t) => next.add(`${t.cell.row}-${t.cell.col}`));
        return next;
      });
    }, 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const doNavigate = useCallback((dir: Direction) => {
    setOverview(false);
    setActive((cur) => {
      const target = dir === "center" ? cur : moveCell(cur, dir);
      const key = `${target.row}-${target.col}`;
      setMounted((prev) => prev.has(key) ? prev : new Set(prev).add(key));
      return target;
    });
  }, []);

  const handleEdgeTap = useCallback((cardinal: Direction) => {
    setOverview(false);
    if (armedDiagonal) {
      knobRef.current?.cancel();
      setArmedDiagonal(null);
      doNavigate(armedDiagonal);
    } else {
      doNavigate(cardinal);
    }
  }, [armedDiagonal, doNavigate]);

  const goTo = useCallback((cell: GridCell) => {
    setOverview(false);
    setActive(cell);
    const key = `${cell.row}-${cell.col}`;
    setMounted((prev) => prev.has(key) ? prev : new Set(prev).add(key));
  }, []);

  const edgeDisabled = {
    n: active.row === 0,
    s: active.row === 2,
    w: active.col === 0,
    e: active.col === 2,
  };
  const knobDisabled = {
    n: active.row === 0,
    s: active.row === 2,
    w: active.col === 0,
    e: active.col === 2,
    ne: active.row === 0 || active.col === 2,
    nw: active.row === 0 || active.col === 0,
    se: active.row === 2 || active.col === 2,
    sw: active.row === 2 || active.col === 0,
  };

  const currentDir = CELL_TO_DIRECTION(active);
  const currentSpace = KITCHEN_SPACES.find(
    (t) => t.cell.row === active.row && t.cell.col === active.col,
  )!;

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative flex flex-col overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="font-extrabold text-base text-foreground leading-tight">
              Kho Bếp
            </h1>
            <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              {currentSpace.emoji} {currentSpace.label}
              <span className="text-primary font-mono">
                [{active.row},{active.col}]
              </span>
              {armedDiagonal && (
                <span className="text-destructive font-bold">
                  → {armedDiagonal.toUpperCase()}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Mini map */}
        <div className="grid grid-cols-3 gap-1 bg-card rounded-lg p-1.5 border border-border">
          {([0, 1, 2] as const).flatMap((row) =>
            ([0, 1, 2] as const).map((col) => {
              const isActive = row === active.row && col === active.col;
              const key = `${row}-${col}`;
              const isMounted = mounted.has(key);
              return (
                <button
                  key={key}
                  onClick={() => goTo({ row, col })}
                  aria-label={`Đi đến hàng ${row + 1} cột ${col + 1}`}
                  className={`h-3 w-3 rounded-sm transition-all duration-200 ${
                    isActive
                      ? "bg-primary scale-110 shadow-sm"
                      : isMounted
                        ? "bg-secondary/60 hover:bg-secondary"
                        : "bg-muted hover:bg-muted-foreground/30"
                  }`}
                />
              );
            }),
          )}
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 relative" style={{ minHeight: 0 }}>
        <div className="absolute inset-0">
          <InventoryEdgeButtons
            onNavigate={handleEdgeTap}
            disabled={edgeDisabled}
            armedDiagonal={armedDiagonal}
            inset={{ top: EDGE, right: EDGE, bottom: KNOB_CLEARANCE, left: EDGE }}
          />

          <div
            className="absolute overflow-hidden rounded-2xl border border-border/60 bg-card"
            style={{ top: EDGE, right: EDGE, bottom: KNOB_CLEARANCE, left: EDGE }}
          >
            {overview ? (
              <OverviewGrid active={active} onJump={goTo} />
            ) : (
              <GridStage active={active} mounted={mounted} />
            )}

            {/* Current space label */}
            {overview ? (
              <div className="pointer-events-none absolute bottom-3 left-3 z-30 bg-card/80 backdrop-blur rounded-full px-3 py-1.5 font-mono text-[10px] font-semibold tracking-wide text-primary border border-border/50">
                <span className="text-muted-foreground mr-1">▸</span>
                TỔNG QUAN
              </div>
            ) : (
              <div className="pointer-events-none absolute bottom-3 left-3 z-30 bg-card/80 backdrop-blur rounded-full px-3 py-1.5 font-mono text-[10px] font-semibold tracking-wide text-secondary border border-border/50">
                <span className="text-muted-foreground mr-1">▸</span>
                {currentSpace.emoji} {currentSpace.label}
              </div>
            )}

            {armedDiagonal && (
              <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 bg-card/80 backdrop-blur rounded-full border-destructive/40 border px-3 py-1.5 font-mono text-[10px] font-bold text-destructive">
                <span className="animate-pulse">⟶</span> NHẤN CẠNH • {armedDiagonal.toUpperCase()}
              </div>
            )}

            {overview && (
              <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 bg-card/80 backdrop-blur rounded-full border-primary/30 border px-3 py-1.5 font-mono text-[10px] font-bold text-primary">
                NHẤN KNOB ĐỂ QUAY LẠI
              </div>
            )}
          </div>

          <InventoryKnob
            ref={knobRef}
            onCommit={doNavigate}
            disabled={knobDisabled}
            onArmedChange={(d) => setArmedDiagonal(isDiagonal(d) ? d : null)}
            activeCell={active}
            offsetBottom={KNOB_OFFSET}
            onTap={() => setOverview((v) => !v)}
          />
        </div>
      </main>
    </div>
  );
};

export default Inventory;


function GridStage({
  active,
  mounted,
}: {
  active: GridCell;
  mounted: Set<string>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cellSize = useRef<{ w: number; h: number } | null>(null);
  const [measured, setMeasured] = useState(false);
  const [visible, setVisible] = useState(false);
  const hasNavigated = useRef(false);
  const prevActive = useRef(active);

  if (prevActive.current.row !== active.row || prevActive.current.col !== active.col) {
    hasNavigated.current = true;
  }
  prevActive.current = active;

  // Measure ONCE on mount, lock the size forever
  useEffect(() => {
    const el = containerRef.current;
    if (!el || cellSize.current) return;
    const { width, height } = el.getBoundingClientRect();
    cellSize.current = { w: Math.floor(width), h: Math.floor(height) };
    setMeasured(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }, []);

  // Defensive scroll lock: `overflow: hidden` does NOT block programmatic
  // scrolls (e.g. focus()/scrollIntoView() inside a cell), which can shift
  // the grid by a whole cell. Pin scrollTop/scrollLeft to 0 forever.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const reset = () => {
      if (el.scrollTop !== 0) el.scrollTop = 0;
      if (el.scrollLeft !== 0) el.scrollLeft = 0;
    };
    reset();
    el.addEventListener("scroll", reset, { passive: true });
    return () => el.removeEventListener("scroll", reset);
  }, [measured]);

  if (!measured || !cellSize.current) {
    return <div ref={containerRef} className="relative h-full w-full overflow-hidden" />;
  }

  const { w: cellW, h: cellH } = cellSize.current;
  const tx = -(active.col * cellW);
  const ty = -(active.row * cellH);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: cellW * 3,
          height: cellH * 3,
          transform: `translate(${tx}px, ${ty}px)`,
          visibility: visible ? "visible" : "hidden",
          transition: hasNavigated.current ? "transform 350ms ease-out" : "none",
          willChange: "transform",
        }}
      >
        {KITCHEN_SPACES.map((space) => {
          const key = `${space.cell.row}-${space.cell.col}`;
          const isMounted = mounted.has(key);
          const isActive = space.cell.row === active.row && space.cell.col === active.col;
          return (
            <div
              key={space.id}
              style={{
                position: "absolute",
                left: space.cell.col * cellW,
                top: space.cell.row * cellH,
                width: cellW,
                height: cellH,
                padding: 2,
                overflow: "hidden",
              }}
              aria-hidden={!isActive}
            >
              <div className="h-full w-full overflow-hidden rounded-xl border border-border/40 bg-card relative">
                {isMounted ? (
                  <InventoryTable id={space.id} label={space.label} emoji={space.emoji} tone={space.tone} />
                ) : (
                  <InventoryTableSkeleton label={space.label} emoji={space.emoji} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OverviewGrid({
  active,
  onJump,
}: {
  active: GridCell;
  onJump: (cell: GridCell) => void;
}) {
  return (
    <div className="grid h-full w-full grid-cols-3 gap-1.5 p-2">
      {KITCHEN_SPACES.map((space) => {
        const isActive = space.cell.row === active.row && space.cell.col === active.col;
        return (
          <button
            key={space.id}
            onClick={() => onJump(space.cell)}
            className={`relative flex flex-col items-center justify-center rounded-xl border px-2 py-3 text-center transition-all duration-200 active:scale-95 ${
              isActive
                ? "border-primary/60 bg-primary/10 shadow-md"
                : "border-border/50 bg-card hover:bg-muted/50"
            }`}
          >
            <span className="text-2xl mb-1">{space.emoji}</span>
            <span className={`font-extrabold text-[11px] leading-tight ${isActive ? "text-primary" : "text-foreground"}`}>
              {space.label}
            </span>
            <span className="font-mono text-[9px] text-muted-foreground mt-0.5">
              [{space.cell.row},{space.cell.col}]
            </span>
            {isActive && (
              <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function InventoryTableSkeleton({ label, emoji }: { label: string; emoji: string }) {
  return (
    <div className="relative flex h-full w-full flex-col bg-card text-foreground">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      <div className="relative flex items-center justify-between border-b border-border/50 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
          <span className="font-extrabold text-sm leading-none text-muted-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[9px]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
          <span className="text-muted-foreground">ĐANG TẢI</span>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2 border-b border-border/40 bg-card/80 px-3 py-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-2 rounded-full bg-muted animate-pulse" />
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-2 border-b border-border/20 px-3 py-2.5">
            {[0, 1, 2, 3, 4].map((c) => (
              <div
                key={c}
                className="h-2 rounded-full bg-muted animate-pulse"
                style={{
                  width: `${50 + ((i * 13 + c * 7) % 50)}%`,
                  animationDelay: `${(i * 80 + c * 40) % 800}ms`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-border/50 bg-card/80 px-3.5 py-1.5 font-mono text-[9px] text-muted-foreground">
        ĐANG KHỞI TẠO...
      </div>
    </div>
  );
}
