import { Category } from '@/types/ingredient';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CategoryCloudProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (id: string) => void;
  isOpen: boolean;
  alertCounts?: Record<string, number>;
}

export function CategoryCloud({ categories, activeCategory, onSelect, isOpen, alertCounts }: CategoryCloudProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden bg-card border-b border-border"
        >
          <div className="flex flex-wrap gap-2 px-4 py-3">
            {categories.map(cat => {
              const alertCount = alertCounts?.[cat.id] ?? 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelect(cat.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200",
                    activeCategory === cat.id
                      ? "text-primary-foreground shadow-lg"
                      : "bg-muted text-card-foreground hover:bg-secondary/30"
                  )}
                  style={activeCategory === cat.id ? { backgroundColor: cat.color } : undefined}
                >
                  <span className="text-base">{cat.emoji}</span>
                  <span>{cat.name}</span>
                  {alertCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[hsl(38,100%,60%)] text-[hsl(220,30%,15%)] text-[10px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center shadow-md z-10">
                      {alertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
