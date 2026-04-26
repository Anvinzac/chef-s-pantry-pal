import type { Direction } from "@/lib/inventoryNav";

interface InventoryEdgeButtonsProps {
  onNavigate: (dir: Direction) => void;
  disabled?: { n?: boolean; s?: boolean; e?: boolean; w?: boolean };
  armedDiagonal?: "ne" | "nw" | "se" | "sw" | null;
  inset?: { top: number | string; right: number | string; bottom: number | string; left: number | string };
}

export function InventoryEdgeButtons({ onNavigate, disabled, armedDiagonal, inset }: InventoryEdgeButtonsProps) {
  const isDiag = !!armedDiagonal;
  const bounds = inset ?? { top: 0, right: 0, bottom: 0, left: 0 };

  const base = "absolute z-30 transition-all duration-200 rounded-sm";
  const tone = isDiag
    ? "bg-secondary shadow-[0_0_16px_hsl(var(--secondary)/0.5)] active:bg-primary"
    : "bg-primary/60 active:bg-secondary shadow-[0_0_8px_hsl(var(--primary)/0.3)]";
  const blockedTone = "bg-black/60 shadow-[0_0_12px_hsl(0_0%_0%/0.5)]";
  const thickness = isDiag ? 10 : 5;

  const handle = (cardinal: "n" | "s" | "e" | "w") => () => {
    if (armedDiagonal) onNavigate(armedDiagonal);
    else onNavigate(cardinal);
  };

  return (
    <>
      <button
        aria-label={isDiag ? `Nhảy ${armedDiagonal!.toUpperCase()}` : "Lên"}
        onClick={handle("n")}
        disabled={!isDiag && disabled?.n}
        className={`${base} ${!isDiag && disabled?.n ? blockedTone : tone}`}
        style={{ top: bounds.top, left: bounds.left, right: bounds.right, height: thickness }}
      />
      <button
        aria-label={isDiag ? `Nhảy ${armedDiagonal!.toUpperCase()}` : "Xuống"}
        onClick={handle("s")}
        disabled={!isDiag && disabled?.s}
        className={`${base} ${!isDiag && disabled?.s ? blockedTone : tone}`}
        style={{ bottom: bounds.bottom, left: bounds.left, right: bounds.right, height: thickness }}
      />
      <button
        aria-label={isDiag ? `Nhảy ${armedDiagonal!.toUpperCase()}` : "Trái"}
        onClick={handle("w")}
        disabled={!isDiag && disabled?.w}
        className={`${base} ${!isDiag && disabled?.w ? blockedTone : tone}`}
        style={{ top: bounds.top, bottom: bounds.bottom, left: bounds.left, width: thickness }}
      />
      <button
        aria-label={isDiag ? `Nhảy ${armedDiagonal!.toUpperCase()}` : "Phải"}
        onClick={handle("e")}
        disabled={!isDiag && disabled?.e}
        className={`${base} ${!isDiag && disabled?.e ? blockedTone : tone}`}
        style={{ top: bounds.top, bottom: bounds.bottom, right: bounds.right, width: thickness }}
      />
    </>
  );
}
