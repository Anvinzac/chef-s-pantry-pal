import { ReactNode } from "react";
import type { MenuCategoryConfig } from "@/data/menuDishes";

export interface TabletOrderingLayoutProps {
  categories: MenuCategoryConfig[];
  activeCategory: string;
  onCategorySelect: (categoryId: string) => void;
  alertCounts?: Record<string, number>;
  children: ReactNode;
}

/**
 * Two-panel layout for tablet/desktop ordering page.
 * Left panel: fixed-width category sidebar (~200px)
 * Right panel: scrollable ingredient content area
 * 
 * Validates: Requirements 4.1, 4.2, 4.3
 */
export function TabletOrderingLayout({
  categories,
  activeCategory,
  onCategorySelect,
  alertCounts = {},
  children,
}: TabletOrderingLayoutProps) {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Category Sidebar */}
      <aside className="w-52 border-r border-border bg-card overflow-y-auto flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {categories.map((category) => {
            const isActive = category.id === activeCategory;
            const alertCount = alertCounts[category.id] ?? 0;

            return (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className={`w-full px-4 py-3 text-left border-b border-border/50 transition-colors flex items-center gap-3 ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-muted/50 text-foreground"
                }`}
              >
                <span className="text-2xl">{category.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{category.name}</div>
                  {alertCount > 0 && (
                    <div className="text-xs text-destructive font-bold">
                      {alertCount} cảnh báo
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
