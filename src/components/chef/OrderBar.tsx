import { OrderItem, UNIT_LABELS } from '@/types/ingredient';
import { ShoppingCart, ChevronUp, Copy, Trash2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { estimateCostK, formatPriceK } from '@/data/referencePrices';

interface OrderBarProps {
  currentOrder: OrderItem[];
  expanded: boolean;
  onToggleExpand: () => void;
  onRemoveItem: (ingredientId: string) => void;
  onClearOrder: () => void;
  getOrderText: (onlyNew?: boolean) => string;
  onSaveOrder?: () => void;
}

export function OrderBar({
  currentOrder,
  expanded,
  onToggleExpand,
  onRemoveItem,
  onClearOrder,
  getOrderText,
  onSaveOrder,
}: OrderBarProps) {
  if (currentOrder.length === 0) return null;

  const recentItems = currentOrder.filter(o => {
    const ts = new Date(o.timestamp).getTime();
    return ts > Date.now() - 5 * 60 * 1000;
  });

  const handleCopy = (full: boolean) => {
    const text = getOrderText(!full);
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Đã sao chép & lưu!', { description: 'Đơn hàng đã được lưu lại' });
      if (onSaveOrder) {
        onSaveOrder();
      }
    });
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
            className="absolute inset-0 z-30 bg-black/40"
            onClick={onToggleExpand}
          />
        )}
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 z-40">
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
                <h3 className="font-extrabold text-sm text-foreground">Danh Sách Đặt Hàng</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold"
                  >
                    <Copy size={12} />
                    Sao Chép
                  </button>
                  <button
                    onClick={onClearOrder}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold"
                  >
                    <Trash2 size={12} />
                    Xóa
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {itemCosts.map(item => (
                  <div key={item.ingredientId} className="flex items-center bg-muted/50 rounded-xl px-3 py-2.5">
                    <span className="text-sm font-semibold text-foreground flex-1 min-w-0 truncate">
                      {item.quantity}{UNIT_LABELS[item.unit]} {item.name}
                    </span>
                    {item.costK !== undefined && (
                      <span className="text-xs font-semibold text-muted-foreground bg-muted rounded-lg px-2 py-1 flex-shrink-0 ml-2">
                        ~{formatPriceK(item.costK)}
                      </span>
                    )}
                    <button
                      onClick={() => onRemoveItem(item.ingredientId)}
                      className="text-destructive hover:text-destructive/80 p-1.5 flex-shrink-0 ml-1.5"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
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
            onClick={(e) => { e.stopPropagation(); handleCopy(false); }}
            className="p-2 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
          >
            <Copy size={16} />
          </button>
          {expanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </div>
    </div>
    </>
  );
}
