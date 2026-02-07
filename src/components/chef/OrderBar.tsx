import { OrderItem, UNIT_LABELS } from '@/types/ingredient';
import { ShoppingCart, ChevronUp, Copy, Trash2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface OrderBarProps {
  currentOrder: OrderItem[];
  expanded: boolean;
  onToggleExpand: () => void;
  onRemoveItem: (ingredientId: string) => void;
  onClearOrder: () => void;
  getOrderText: (onlyNew?: boolean) => string;
}

export function OrderBar({
  currentOrder,
  expanded,
  onToggleExpand,
  onRemoveItem,
  onClearOrder,
  getOrderText,
}: OrderBarProps) {
  if (currentOrder.length === 0) return null;

  const recentItems = currentOrder.filter(o => {
    const ts = new Date(o.timestamp).getTime();
    return ts > Date.now() - 5 * 60 * 1000;
  });

  const handleCopy = (full: boolean) => {
    const text = getOrderText(!full);
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Order list copied!', { description: 'Paste it into your messaging app' });
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-card border-t border-border overflow-hidden"
          >
            <div className="p-4 max-h-[50vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-sm text-foreground">Full Shopping List</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold"
                  >
                    <Copy size={12} />
                    Copy All
                  </button>
                  <button
                    onClick={onClearOrder}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold"
                  >
                    <Trash2 size={12} />
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {currentOrder.map(item => (
                  <div key={item.ingredientId} className="flex items-center justify-between bg-muted rounded-xl px-3 py-2">
                    <span className="text-sm font-semibold text-foreground">
                      {item.quantity}{UNIT_LABELS[item.unit]} {item.name}
                    </span>
                    <button
                      onClick={() => onRemoveItem(item.ingredientId)}
                      className="text-destructive hover:text-destructive/80 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
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
              {currentOrder.length} item{currentOrder.length !== 1 ? 's' : ''} in order
            </p>
            {recentItems.length > 0 && !expanded && (
              <p className="text-[10px] opacity-80">
                +{recentItems.length} just added • Tap to expand
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(false); }}
            className="p-2 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
          >
            <Copy size={16} />
          </button>
          {expanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </div>
    </div>
  );
}
