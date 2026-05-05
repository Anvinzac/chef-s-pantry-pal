import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Direction } from "@/lib/inventoryNav";
import { angleToDirection } from "@/lib/inventoryNav";

/* Spring-bounce keyframes: zoom out overshoots to 0.5 then settles at 0.7;
   zoom in overshoots to 1.18 then settles at 1.0. */
const BOUNCE_CSS = `
@keyframes knob-zoom-out {
  0%   { transform: translate(0, 0) scale(1); }
  30%  { transform: translate(0, 0) scale(0.48); }
  55%  { transform: translate(0, 0) scale(0.78); }
  75%  { transform: translate(0, 0) scale(0.62); }
  100% { transform: translate(0, 0) scale(0.7); }
}
@keyframes knob-zoom-in {
  0%   { transform: translate(0, 0) scale(0.7); }
  30%  { transform: translate(0, 0) scale(1.18); }
  55%  { transform: translate(0, 0) scale(0.92); }
  75%  { transform: translate(0, 0) scale(1.05); }
  100% { transform: translate(0, 0) scale(1); }
}
`;

export interface InventoryKnobHandle {
  cancel: () => void;
}

interface InventoryKnobProps {
  onCommit: (dir: Direction) => void;
  disabled?: Partial<Record<Exclude<Direction, "center">, boolean>>;
  onArmedChange?: (dir: Exclude<Direction, "center"> | null) => void;
  activeCell?: { row: 0 | 1 | 2; col: 0 | 1 | 2 };
  offsetBottom?: number | string;
  onTap?: () => void;
  isOverview?: boolean;
}

const KNOB_SIZE = 62;
const TRACK_RADIUS = 28;
const PREVIEW_RADIUS = 8;
const TRIGGER_RADIUS = 16;

export const InventoryKnob = forwardRef<InventoryKnobHandle, InventoryKnobProps>(function InventoryKnob(
  { onCommit, disabled, onArmedChange, activeCell, offsetBottom = 0, onTap, isOverview },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [armed, setArmed] = useState<Exclude<Direction, "center"> | null>(null);
  const [blocked, setBlocked] = useState<Exclude<Direction, "center"> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const armedRef = useRef<Exclude<Direction, "center"> | null>(null);
  const cancelledRef = useRef(false);
  const tapRef = useRef(false);
  const prevOverviewRef = useRef(isOverview);
  const [animKey, setAnimKey] = useState<"zoom-out" | "zoom-in" | null>(null);

  // Inject bounce keyframes once on mount
  useEffect(() => {
    if (document.getElementById("knob-bounce-keyframes")) return;
    const style = document.createElement("style");
    style.id = "knob-bounce-keyframes";
    style.textContent = BOUNCE_CSS;
    document.head.appendChild(style);
  }, []);

  // Trigger bounce animation when overview toggles
  useEffect(() => {
    if (drag) return; // don't animate while dragging
    if (prevOverviewRef.current !== isOverview) {
      setAnimKey(isOverview ? "zoom-out" : "zoom-in");
      const t = setTimeout(() => setAnimKey(null), 500);
      prevOverviewRef.current = isOverview;
      return () => clearTimeout(t);
    }
  }, [isOverview, drag]);

  useEffect(() => {
    armedRef.current = armed;
    onArmedChange?.(armed);
  }, [armed, onArmedChange]);

  useImperativeHandle(ref, () => ({
    cancel: () => {
      cancelledRef.current = true;
      setArmed(null);
      setBlocked(null);
      setDrag(null);
      startRef.current = null;
    },
  }), []);

  useEffect(() => {
    if (!drag) return;

    // Pointermove can fire at 120Hz+ on modern devices. Coalesce to one
    // logic+state update per animation frame: capture the latest pointer
    // coords on every event but defer the math + setState to the next
    // rAF. Haptic feedback still fires from the deferred handler — a
    // sub-frame delay is imperceptible for vibrate() but the wins on
    // re-render volume add up over a long drag.
    let pendingX = 0;
    let pendingY = 0;
    let hasPending = false;
    let rafId: number | null = null;

    const processMove = () => {
      rafId = null;
      if (!hasPending || !startRef.current || cancelledRef.current) return;
      hasPending = false;

      const dx = pendingX - startRef.current.x;
      const dy = pendingY - startRef.current.y;
      const dist = Math.hypot(dx, dy);
      const clamped = Math.min(dist, TRACK_RADIUS);
      const ratio = dist > 0 ? clamped / dist : 0;
      setDrag({ x: dx * ratio, y: dy * ratio });

      if (dist < PREVIEW_RADIUS) {
        setArmed(null);
        setBlocked(null);
        return;
      }

      tapRef.current = false;

      const angle = Math.atan2(-dy, dx);
      const dir = angleToDirection(angle);

      if (disabled?.[dir]) {
        setArmed(null);
        setBlocked((prev) => {
          if (prev !== dir && navigator.vibrate) navigator.vibrate(10);
          return dir;
        });
        return;
      }

      setBlocked(null);
      if (dist >= TRIGGER_RADIUS) {
        setArmed((prev) => {
          if (prev !== dir && navigator.vibrate) navigator.vibrate(8);
          return dir;
        });
      } else {
        setArmed(null);
      }
    };

    const onMove = (e: PointerEvent) => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      hasPending = true;
      if (rafId === null) rafId = requestAnimationFrame(processMove);
    };

    const onUp = () => {
      // Drain any pending coalesced move synchronously so the final
      // armed direction reflects the actual release position, not the
      // last frame.
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
        processMove();
      }
      const finalArmed = armedRef.current;
      if (!cancelledRef.current && tapRef.current) {
        onTap?.();
      } else if (!cancelledRef.current && finalArmed) {
        if (navigator.vibrate) navigator.vibrate([12, 20, 12]);
        onCommit(finalArmed);
      }
      cancelledRef.current = false;
      tapRef.current = false;
      setDrag(null);
      setArmed(null);
      setBlocked(null);
      startRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [drag, onCommit, disabled]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    cancelledRef.current = false;
    tapRef.current = true;
    startRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0 });
    if (navigator.vibrate) navigator.vibrate(6);
  };

  const active = drag !== null;

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute left-1/2 z-40 -translate-x-1/2"
      style={{ width: KNOB_SIZE, height: KNOB_SIZE, bottom: offsetBottom }}
    >
      {/* Compass ring */}
      <div
        className="absolute left-1/2 top-1/2 transition-opacity duration-200"
        style={{
          width: KNOB_SIZE * 2,
          height: KNOB_SIZE * 2,
          opacity: active ? 1 : 0,
          transform: "translate(-50%, -50%)",
        }}
      >
        <CompassRing armed={armed} blocked={blocked} disabled={disabled} />
      </div>

      <button
        aria-label="Điều hướng kho — giữ và kéo 8 hướng"
        onPointerDown={onPointerDown}
        onClick={(e) => e.preventDefault()}
        className={`pointer-events-auto relative flex items-center justify-center rounded-full transition-all duration-150 ${
          blocked
            ? "bg-destructive"
            : armed
            ? "bg-secondary"
            : "bg-primary"
        }`}
        style={{
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          transform: `translate(${drag?.x ?? 0}px, ${drag?.y ?? 0}px) scale(${isOverview ? 0.7 : 1})`,
          transition: drag
            ? "background 100ms"
            : animKey
              ? "none"
              : "transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1), background 100ms",
          animation: animKey === "zoom-out"
            ? "knob-zoom-out 480ms cubic-bezier(0.22, 1, 0.36, 1) forwards"
            : animKey === "zoom-in"
              ? "knob-zoom-in 480ms cubic-bezier(0.22, 1, 0.36, 1) forwards"
              : "none",
          boxShadow: blocked
            ? "0 0 0 3px hsl(var(--destructive) / 0.3), 0 0 24px hsl(var(--destructive) / 0.6)"
            : armed
            ? "0 0 0 3px hsl(var(--secondary) / 0.3), 0 0 24px hsl(var(--secondary) / 0.6)"
            : active
              ? "0 0 0 3px hsl(var(--primary) / 0.3), 0 0 24px hsl(var(--primary) / 0.5)"
              : "0 0 16px hsl(var(--primary) / 0.4)",
          touchAction: "none",
        }}
      >
        <KnobMiniMap
          activeCell={activeCell ?? { row: 1, col: 1 }}
          armed={armed}
          blocked={blocked}
          disabled={disabled}
        />
      </button>
    </div>
  );
});


function CompassRing({
  armed,
  blocked,
  disabled,
}: {
  armed: Exclude<Direction, "center"> | null;
  blocked: Exclude<Direction, "center"> | null;
  disabled?: Partial<Record<Exclude<Direction, "center">, boolean>>;
}) {
  const dirs: Exclude<Direction, "center">[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
  const angleFor: Record<Exclude<Direction, "center">, number> = {
    n: 0, ne: 45, e: 90, se: 135, s: 180, sw: 225, w: 270, nw: 315,
  };
  const R = 60;

  return (
    <svg viewBox="-100 -100 200 200" className="h-full w-full">
      <circle cx="0" cy="0" r={R} fill="none" stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="3 5" opacity="0.3" />
      {dirs.map((d) => {
        const a = (angleFor[d] - 90) * (Math.PI / 180);
        const x = Math.cos(a) * R;
        const y = Math.sin(a) * R;
        const isArmed = armed === d;
        const isBlocked = blocked === d;
        const isOff = disabled?.[d];
        return (
          <g key={d} transform={`translate(${x}, ${y})`}>
            {isArmed && (
              <circle r={14} fill="hsl(var(--secondary))" opacity="0.3">
                <animate attributeName="r" values="12;18;12" dur="1.2s" repeatCount="indefinite" />
              </circle>
            )}
            {isBlocked && (
              <circle r={14} fill="hsl(var(--destructive))" opacity="0.2">
                <animate attributeName="r" values="12;18;12" dur="0.8s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              r={isArmed || isBlocked ? 10 : 8}
              fill={
                isBlocked ? "hsl(var(--destructive))"
                  : isArmed ? "hsl(var(--secondary))"
                  : isOff ? "hsl(var(--muted))"
                  : "hsl(var(--card))"
              }
              stroke={isBlocked ? "hsl(var(--destructive-foreground))" : isArmed ? "hsl(var(--secondary))" : "hsl(var(--border))"}
              strokeWidth={isArmed || isBlocked ? 2 : 1}
              opacity={isBlocked ? 1 : isOff ? 0.35 : 1}
            />
            <text
              x={0} y={3} textAnchor="middle"
              fontSize="7" fontWeight="700"
              fill={
                isBlocked ? "hsl(var(--destructive-foreground))"
                  : isArmed ? "hsl(var(--secondary-foreground))"
                  : isOff ? "hsl(var(--muted-foreground))"
                  : "hsl(var(--foreground))"
              }
              opacity={isBlocked ? 1 : isOff ? 0.6 : 1}
            >
              {d.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function KnobMiniMap({
  activeCell,
  armed,
  blocked,
  disabled,
}: {
  activeCell: { row: 0 | 1 | 2; col: 0 | 1 | 2 };
  armed: Exclude<Direction, "center"> | null;
  blocked: Exclude<Direction, "center"> | null;
  disabled?: Partial<Record<Exclude<Direction, "center">, boolean>>;
}) {
  return (
    <div className="grid grid-cols-3 gap-[3px] p-2">
      {([0, 1, 2] as const).flatMap((row) =>
        ([0, 1, 2] as const).map((col) => {
          const isActive = row === activeCell.row && col === activeCell.col;
          return (
            <div
              key={`${row}-${col}`}
              className={`h-2.5 w-2.5 rounded-sm transition-all duration-200 ${
                isActive
                  ? "bg-primary-foreground scale-110"
                  : "bg-primary-foreground/30"
              }`}
            />
          );
        }),
      )}
    </div>
  );
}
