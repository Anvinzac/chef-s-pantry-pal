import { Subcategory } from '@/types/ingredient';
import { cn } from '@/lib/utils';

interface SubcategoryBarProps {
  subcategories: Subcategory[];
  activeSubcategory: string | null;
  onSelect: (id: string | null) => void;
}

export function SubcategoryBar({ subcategories, activeSubcategory, onSelect }: SubcategoryBarProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-4 pb-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0",
          activeSubcategory === null
            ? "bg-secondary text-secondary-foreground"
            : "bg-muted text-muted-foreground hover:bg-secondary/30"
        )}
      >
        All
      </button>
      {subcategories.map(sub => (
        <button
          key={sub.id}
          onClick={() => onSelect(sub.id)}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1",
            activeSubcategory === sub.id
              ? "bg-secondary text-secondary-foreground"
              : "bg-muted text-muted-foreground hover:bg-secondary/30"
          )}
        >
          {sub.emoji && <span className="text-xs">{sub.emoji}</span>}
          {sub.name}
        </button>
      ))}
    </div>
  );
}
