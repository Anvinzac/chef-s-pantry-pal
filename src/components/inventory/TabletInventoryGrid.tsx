import { InventoryTable } from "./InventoryTable";
import { KITCHEN_SPACES, type KitchenSpace } from "@/lib/inventoryNav";

export interface TabletInventoryGridProps {
  spaces?: KitchenSpace[];
  onSpaceSelect?: (space: KitchenSpace) => void;
}

/**
 * Renders all kitchen spaces in a responsive grid layout for tablet/desktop.
 * Each space gets its own independently scrollable InventoryTable.
 * 
 * Grid layout:
 * - 2 columns on tablet (md: 768–1023px)
 * - 3 columns on desktop (lg: ≥ 1024px)
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.6
 */
export function TabletInventoryGrid({
  spaces = KITCHEN_SPACES,
  onSpaceSelect,
}: TabletInventoryGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-4 h-full overflow-auto">
      {spaces.map((space) => (
        <div
          key={space.id}
          className="relative h-96 rounded-lg overflow-hidden border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow"
          onClick={() => onSpaceSelect?.(space)}
        >
          <InventoryTable
            id={space.id}
            label={space.label}
            emoji={space.emoji}
            tone={space.tone}
          />
        </div>
      ))}
    </div>
  );
}
