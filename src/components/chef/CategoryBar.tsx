import { Category } from '@/types/ingredient';
import { cn } from '@/lib/utils';

interface CategoryBarProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (id: string) => void;
}

export function CategoryBar({ categories, activeCategory, onSelect }: CategoryBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0",
            activeCategory === cat.id
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
              : "bg-card text-card-foreground border border-border hover:border-primary/30"
          )}
        >
          <span className="text-base">{cat.emoji}</span>
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  );
}
