import { Subcategory } from '@/types/ingredient';
import { cn } from '@/lib/utils';
import { Grid3X3 } from 'lucide-react';

interface SubcategoryBarProps {
  subcategories: Subcategory[];
  activeSubcategory: string | null;
  onSelect: (id: string | null) => void;
  onExpandCategories?: () => void;
}

export function SubcategoryBar({ subcategories, activeSubcategory, onSelect, onExpandCategories }: SubcategoryBarProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-4 pb-2 items-center">
      {onExpandCategories && (
        <button
          onClick={onExpandCategories}
          className="p-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors shrink-0 active:scale-95"
          title="Xem tất cả danh mục"
        >
          <Grid3X3 size={14} />
        </button>
      )}
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
