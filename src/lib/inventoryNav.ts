/**
 * Inventory navigation — 3x3 grid representing 9 physical kitchen spaces.
 * Adapted from knobdrive's nav.ts for the chef app.
 */

export type Direction =
  | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "center";

export type GridCell = { row: 0 | 1 | 2; col: 0 | 1 | 2 };

export type KitchenTone = "primary" | "accent" | "signal" | "muted";

export interface KitchenSpace {
  id: string;
  label: string;
  emoji: string;
  cell: GridCell;
  tone: KitchenTone;
}

export const KITCHEN_SPACES: KitchenSpace[] = [
  { id: "K1", label: "Tủ Đông",       emoji: "🧊", cell: { row: 0, col: 0 }, tone: "muted" },
  { id: "K2", label: "Tủ Mát",        emoji: "❄️", cell: { row: 0, col: 1 }, tone: "accent" },
  { id: "K3", label: "Kệ Gia Vị",     emoji: "🧂", cell: { row: 0, col: 2 }, tone: "muted" },
  { id: "K4", label: "Kệ Khô",        emoji: "🫘", cell: { row: 1, col: 0 }, tone: "signal" },
  { id: "K5", label: "Bàn Bếp Chính", emoji: "🔪", cell: { row: 1, col: 1 }, tone: "primary" },
  { id: "K6", label: "Kệ Nước/Chai",  emoji: "🫙", cell: { row: 1, col: 2 }, tone: "signal" },
  { id: "K7", label: "Kho Dưới",      emoji: "📦", cell: { row: 2, col: 0 }, tone: "muted" },
  { id: "K8", label: "Khu Rửa",       emoji: "🚿", cell: { row: 2, col: 1 }, tone: "accent" },
  { id: "K9", label: "Khu Gas/Bếp",   emoji: "🔥", cell: { row: 2, col: 2 }, tone: "muted" },
];

export const DIRECTION_TO_CELL: Record<Direction, GridCell> = {
  nw:     { row: 0, col: 0 },
  n:      { row: 0, col: 1 },
  ne:     { row: 0, col: 2 },
  w:      { row: 1, col: 0 },
  center: { row: 1, col: 1 },
  e:      { row: 1, col: 2 },
  sw:     { row: 2, col: 0 },
  s:      { row: 2, col: 1 },
  se:     { row: 2, col: 2 },
};

export const CELL_TO_DIRECTION = (cell: GridCell): Direction => {
  return (Object.entries(DIRECTION_TO_CELL).find(
    ([, c]) => c.row === cell.row && c.col === cell.col,
  )?.[0] as Direction) ?? "center";
};

/** Convert an angle (radians, 0 = east, CCW) into one of 8 compass directions. */
export function angleToDirection(angle: number): Exclude<Direction, "center"> {
  const a = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const sector = Math.round(a / (Math.PI / 4)) % 8;
  return (["e", "ne", "n", "nw", "w", "sw", "s", "se"] as const)[sector];
}

/** Move from a cell in a direction, clamped to the 3x3 grid. */
export function moveCell(from: GridCell, dir: Direction): GridCell {
  const dx = dir.includes("e") ? 1 : dir.includes("w") ? -1 : 0;
  const dy = dir.includes("s") ? 1 : dir.includes("n") ? -1 : 0;
  return {
    row: Math.min(2, Math.max(0, from.row + dy)) as 0 | 1 | 2,
    col: Math.min(2, Math.max(0, from.col + dx)) as 0 | 1 | 2,
  };
}
