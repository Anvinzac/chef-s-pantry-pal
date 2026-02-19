import { Category } from '@/types/ingredient';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CategoryCloudProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  alertCounts?: Record<string, number>;
}

export function CategoryCloud({ categories, activeCategory, onSelect, isOpen, onClose, alertCounts }: CategoryCloudProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-card w-full max-w-sm rounded-2xl p-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm text-card-foreground">Tất cả danh mục</h3>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => {
                const alertCount = alertCounts?.[cat.id] ?? 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { onSelect(cat.id); onClose(); }}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
