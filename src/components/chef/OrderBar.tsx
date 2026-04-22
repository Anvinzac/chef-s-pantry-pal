import { OrderItem, UNIT_LABELS, Ingredient, UNIT_FULL_LABELS } from '@/types/ingredient';
import { ShoppingCart, ChevronUp, Copy, Trash2, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { estimateCostK, formatPriceK } from '@/data/referencePrices';
import { categories } from '@/data/defaultIngredients';
import { useMemo, useEffect, useRef, useState } from 'react';

interface OrderBarProps {
  currentOrder: OrderItem[];
  ingredients: Ingredient[];
  expanded: boolean;
  onToggleExpand: () => void;
  onRemoveItem: (ingredientId: string) => void;
  onClearOrder: () => void;
  getOrderText: (onlyNew?: boolean) => string;
  onSaveOrder?: () => void;
}

export function OrderBar({
  currentOrder,
  ingredients,
  expanded,
  onToggleExpand,
  onRemoveItem,
  onClearOrder,
  getOrderText,
  onSaveOrder,
}: OrderBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [copiedCategory, setCopiedCategory] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Group items by category - now using category field directly from OrderItem
  const itemsByCategory = useMemo(() => {
    const grouped = new Map<string, OrderItem[]>();
    
    currentOrder.forEach(item => {
      // Use category from OrderItem, fallback to looking up ingredient if not present
      const categoryId = item.category ?? ingredients.find(ing => ing.id === item.ingredientId)?.category ?? 'other';
      
      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, []);
      }
      grouped.get(categoryId)!.push(item);
    });

    return Array.from(grouped.entries())
      .filter(([_, items]) => items.length > 0)
      .map(([categoryId, items]) => {
        const category = categories.find(c => c.id === categoryId);
        return {
          categoryId,
          categoryName: category?.name ?? categoryId,
          categoryEmoji: category?.emoji ?? '📦',
          categoryColor: category?.color ?? '#888',
          items: items.map(item => ({
            ...item,
            costK: estimateCostK(item.ingredientId, item.quantity),
          })),
        };
      });
  }, [currentOrder, ingredients]);

  // Scroll to center the middle card when expanded
  useEffect(() => {
    if (expanded && scrollContainerRef.current && itemsByCategory.length > 0) {
      const container = scrollContainerRef.current;
      const middleIndex = Math.floor(itemsByCategory.length / 2);
      const cardWidth = 280; // approximate card width + gap
      const scrollPosition = middleIndex * cardWidth - (container.clientWidth / 2) + (cardWidth / 2);
      container.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
    }
  }, [expanded, itemsByCategory.length]);

  if (currentOrder.length === 0) return null;

  const recentItems = currentOrder.filter(o => {
    const ts = new Date(o.timestamp).getTime();
    return ts > Date.now() - 5 * 60 * 1000;
  });

  const handleCopyAll = async () => {
    const text = getOrderText(false);
    
    try {
      // Copy to clipboard first
      await navigator.clipboard.writeText(text);
      
      // Show checkmark
      setCopiedAll(true);
      
      // Wait 0.5 seconds then open share
      setTimeout(async () => {
        setCopiedAll(false);
        
        // Check if Web Share API is available (mobile devices)
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Đơn hàng',
              text: text,
            });
          } catch (shareError) {
            // User cancelled share, that's okay
          }
        }
        
        // Save order after sharing
        if (onSaveOrder) {
          onSaveOrder();
        }
      }, 500);
      
    } catch (error) {
      toast.error('Không thể sao chép', { 
        description: 'Vui lòng thử lại' 
      });
    }
  };

  const handleCopyCategory = async (categoryGroup: typeof itemsByCategory[0]) => {
    // Generate text for this category only
    const categoryText = categoryGroup.items.map(item => {
      const unitLabel = UNIT_FULL_LABELS[item.unit] || item.unit;
      if (item.unit === 'piece' || item.unit === 'dozen' || item.unit === 'pair') {
        return `${item.quantity} ${unitLabel}${item.quantity > 1 ? 's' : ''} of ${item.name}${item.supplier ? ` (${item.supplier})` : ''}`;
      }
      return `${item.quantity}${UNIT_LABELS[item.unit]} ${item.name}${item.supplier ? ` (${item.supplier})` : ''}`;
    }).join('\n');

    const fullText = `${categoryGroup.categoryEmoji} ${categoryGroup.categoryName}\n${categoryText}`;

    try {
      // Copy to clipboard first
      await navigator.clipboard.writeText(fullText);
      
      // Show checkmark
      setCopiedCategory(categoryGroup.categoryId);
      
      // Wait 0.5 seconds then open share
      setTimeout(async () => {
        setCopiedCategory(null);
        
        // Check if Web Share API is available (mobile devices)
        if (navigator.share) {
          try {
            await navigator.share({
              title: `Đơn hàng ${categoryGroup.categoryName}`,
              text: fullText,
            });
          } catch (shareError) {
            // User cancelled share, that's okay
          }
        }
      }, 500);
      
    } catch (error) {
      toast.error('Không thể sao chép', { 
        description: 'Vui lòng thử lại' 
      });
    }
  };

  const itemCosts = currentOrder.map(item => ({
    ...item,
    costK: estimateCostK(item.ingredientId, item.quantity),
  }));
  const totalCostK = itemCosts.reduce((sum, item) => sum + (item.costK ?? 0), 0);
  const roundedTotal = Math.round(totalCostK * 10) / 10;

  return (
    <>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/40"
            onClick={onToggleExpand}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto">
        <AnimatePresence>
          {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-card border-t border-border overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-sm text-foreground">Danh Sách Đặt Hàng</h3>
                <button
                  onClick={onClearOrder}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold"
                >
                  <Trash2 size={12} />
                  Xóa Tất Cả
                </button>
              </div>

              {/* Horizontal scrollable category cards */}
              <div 
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory -mx-4 px-4 scrollbar-hide"
              >
                {itemsByCategory.map((categoryGroup) => {
                  const categoryCostK = categoryGroup.items.reduce((sum, item) => sum + (item.costK ?? 0), 0);
                  
                  return (
                    <div
                      key={categoryGroup.categoryId}
                      className="flex-shrink-0 w-[85vw] max-w-[340px] snap-center first:ml-0"
                    >
                      <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl p-4 border-2 border-border shadow-lg h-full flex flex-col min-h-[200px]">
                        {/* Category header */}
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b-2 border-border/50">
                          <span className="text-3xl">{categoryGroup.categoryEmoji}</span>
                          <div className="flex-1 min-w-0">
                            <h4 
                              className="font-extrabold text-lg leading-tight truncate"
                              style={{ color: categoryGroup.categoryColor }}
                            >
                              {categoryGroup.categoryName}
                            </h4>
                            <p className="text-xs text-muted-foreground font-semibold">
                              {categoryGroup.items.length} món • ~{formatPriceK(Math.round(categoryCostK * 10) / 10)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyCategory(categoryGroup);
                            }}
                            disabled={copiedCategory === categoryGroup.categoryId}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all active:scale-95 flex-shrink-0 disabled:bg-green-600 disabled:cursor-default"
                            title="Sao chép"
                          >
                            {copiedCategory === categoryGroup.categoryId ? (
                              <>
                                <Check size={12} className="animate-in zoom-in" />
                                <span className="hidden sm:inline">Đã chép</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span className="hidden sm:inline">Sao chép</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Items list */}
                        <div className="flex-1 space-y-2 max-h-[35vh] overflow-y-auto pr-1 scrollbar-hide">
                          {categoryGroup.items.map(item => (
                            <div 
                              key={item.ingredientId} 
                              className="flex items-center bg-card rounded-xl px-3 py-2.5 shadow-sm border border-border/50"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {item.emoji && <span className="text-sm">{item.emoji}</span>}
                                  <p className="text-sm font-bold text-foreground truncate">
                                    {item.name}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-xs font-semibold text-primary">
                                    {item.quantity}{UNIT_LABELS[item.unit]}
                                  </span>
                                  {item.costK !== undefined && (
                                    <span className="text-xs font-semibold text-muted-foreground">
                                      ~{formatPriceK(item.costK)}
                                    </span>
                                  )}
                                  {item.supplier && (
                                    <span className="text-[10px] font-semibold text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded">
                                      {item.supplier}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveItem(item.ingredientId);
                                }}
                                className="text-destructive hover:text-destructive/80 p-1.5 flex-shrink-0 ml-2 rounded-lg hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Scroll indicator */}
              {itemsByCategory.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-2 mb-2">
                  {itemsByCategory.map((cat, idx) => (
                    <div
                      key={cat.categoryId}
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30"
                    />
                  ))}
                </div>
              )}

              {/* Grand total */}
              <div className="mt-2 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-sm font-extrabold text-foreground">Tổng Ước Tính</span>
                <span className="text-sm font-extrabold text-primary">~{formatPriceK(roundedTotal)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="bg-primary text-primary-foreground px-4 py-3 safe-bottom flex items-center justify-between cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart size={22} />
            <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center">
              {currentOrder.length}
            </span>
          </div>
          <div>
            <p className="font-extrabold text-sm">
              {currentOrder.length} món ~{formatPriceK(roundedTotal)}
            </p>
            {recentItems.length > 0 && !expanded && (
              <p className="text-[10px] opacity-80">
                +{recentItems.length} vừa thêm • Nhấn mở rộng
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleCopyAll(); }}
            disabled={copiedAll}
            className="p-2 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-all disabled:bg-green-600/30 disabled:cursor-default"
            title="Sao chép tất cả"
          >
            {copiedAll ? (
              <Check size={16} className="animate-in zoom-in" />
            ) : (
              <Copy size={16} />
            )}
          </button>
          {expanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </div>
    </div>
    </>
  );
}
