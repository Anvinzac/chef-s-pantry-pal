import { useState, useRef } from 'react';
import { useMenuPlanner } from '@/hooks/useMenuPlanner';
import { menuCategories, MenuCategoryConfig, MenuDish } from '@/data/menuDishes';
import { Copy, X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function MenuPlanner() {
  const {
    selectedDishes,
    toggleDish,
    removeDish,
    isDishSelected,
    isYesterdayDish,
    getMenuText,
    validateMenu,
    saveMenu,
    maxDishes,
  } = useMenuPlanner();

  const [expanded, setExpanded] = useState(false);
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const warnings = validateMenu();
  const activeCategory = menuCategories[activeCategoryIdx];

  const handleCopy = () => {
    const w = validateMenu();
    if (w.length > 0) {
      toast.warning('Cảnh báo menu', {
        description: w.join('\n'),
        duration: 5000,
      });
    }
    const text = getMenuText();
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Đã sao chép menu!');
      saveMenu();
    });
  };

  const handleDishTap = (dish: MenuDish) => {
    toggleDish(dish);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top 30% - Selected dishes */}
      <div className={cn(
        "border-b border-border transition-all duration-300 flex flex-col",
        expanded ? "flex-1" : "h-[30%]"
      )}>
        <div className="flex items-center justify-between px-3 pt-2 pb-1">
          <h2 className="font-extrabold text-sm text-foreground">
            📋 Menu ({selectedDishes.length}/{maxDishes})
          </h2>
          <div className="flex items-center gap-1.5">
            {warnings.length > 0 && (
              <span className="text-destructive">
                <AlertTriangle size={14} />
              </span>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold active:scale-95 transition-transform"
            >
              <Copy size={12} />
              Sao chép
            </button>
          </div>
        </div>

        {/* Selected dishes list */}
        <div className="flex-1 overflow-auto px-3 pb-2">
          <p className="text-[10px] text-muted-foreground font-semibold mb-1 italic">
            Dạ, hôm nay Lá có:
          </p>

          {expanded ? (
            // Expanded: single column
            <div className="space-y-0.5">
              {selectedDishes.map(dish => (
                <div key={dish.id} className="flex items-center gap-1.5 group">
                  <span className="text-xs font-bold text-foreground whitespace-nowrap">
                    {dish.order}. {dish.name}
                  </span>
                  {dish.id !== 'fixed-cari' && (
                    <button
                      onClick={() => removeDish(dish.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-destructive transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Compact: multi-column scrollable
            <div className="flex gap-3 overflow-x-auto scrollbar-hide h-full">
              {[0, 1, 2].map(col => {
                const colDishes = selectedDishes.filter((_, i) => i % 3 === col);
                return (
                  <div key={col} className="flex flex-col gap-0.5 min-w-0 flex-shrink-0">
                    {colDishes.map(dish => (
                      <span
                        key={dish.id}
                        className="text-[10px] font-semibold text-foreground whitespace-nowrap leading-tight"
                      >
                        {dish.order}. {dish.name}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Warnings */}
          <AnimatePresence>
            {warnings.length > 0 && expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 bg-destructive/10 border border-destructive/30 rounded-lg px-2.5 py-1.5"
              >
                {warnings.map((w, i) => (
                  <p key={i} className="text-[10px] font-semibold text-destructive flex items-center gap-1">
                    <AlertTriangle size={10} />
                    {w}
                  </p>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom 70% - Category dish picker */}
      <div className={cn(
        "flex flex-col transition-all duration-300",
        expanded ? "h-0 overflow-hidden" : "h-[70%]"
      )}>
        {/* Category tabs */}
        <div className="flex overflow-x-auto scrollbar-hide border-b border-border px-2 gap-0.5 py-1.5 flex-shrink-0">
          {menuCategories.map((cat, idx) => {
            const hasSelected = selectedDishes.some(d => d.category === cat.id && d.id !== 'fixed-cari');
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryIdx(idx)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex-shrink-0",
                  idx === activeCategoryIdx
                    ? "bg-primary text-primary-foreground"
                    : hasSelected
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {cat.vnName}
                {cat.singleChoice && <span className="text-[8px] opacity-70 ml-0.5">•1</span>}
              </button>
            );
          })}
        </div>

        {/* Dish grid */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-extrabold text-foreground">
              {activeCategory.vnName}
              {activeCategory.singleChoice && (
                <span className="text-[9px] text-muted-foreground font-semibold ml-1.5">
                  (chọn 1)
                </span>
              )}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {activeCategory.dishes.map(dish => {
              const selected = isDishSelected(dish.id);
              const yesterday = isYesterdayDish(dish.id);
              const isSingle = activeCategory.singleChoice;

              return (
                <button
                  key={dish.id}
                  onClick={() => handleDishTap(dish)}
                  className={cn(
                    "relative rounded-xl px-3 py-3 text-left transition-all duration-150 active:scale-95 border-2",
                    selected
                      ? "border-primary bg-primary/15 shadow-md shadow-primary/15"
                      : yesterday && isSingle
                        ? "border-[hsl(var(--warning))]/40 bg-[hsl(var(--warning))]/5"
                        : "border-transparent bg-card shadow-sm"
                  )}
                >
                  <span className="text-xs font-bold text-card-foreground block">
                    {dish.name}
                  </span>
                  {selected && (
                    <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[8px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center">
                      ✓
                    </span>
                  )}
                  {yesterday && isSingle && (
                    <span className="text-[8px] font-semibold text-[hsl(var(--warning))] mt-0.5 block">
                      Hôm qua đã có
                    </span>
                  )}
                  {selected && !activeCategory.singleChoice && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeDish(dish.id); }}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/40 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
