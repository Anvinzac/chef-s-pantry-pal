import { Category } from '@/types/ingredient';
import { cn } from '@/lib/utils';

interface CategoryBarProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (id: string) => void;
  alertCounts?: Record<string, number>;
}

export function CategoryBar({ categories, activeCategory, onSelect, alertCounts }: CategoryBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
      {categories.map(cat => {
        const alertCount = alertCounts?.[cat.id] ?? 0;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0",
              activeCategory === cat.id
                ? "text-primary-foreground shadow-lg scale-105"
                : "bg-card text-card-foreground border border-border hover:border-primary/30"
            )}
            style={activeCategory === cat.id ? { backgroundColor: cat.color } : undefined}
          >
            <span className="text-base">{cat.emoji}</span>
            <span>{cat.name}</span>
            {alertCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[hsl(38,100%,60%)] text-[hsl(220,30%,15%)] text-[10px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-pulse z-10">
                {alertCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
