import { Ingredient, UNIT_LABELS } from '@/types/ingredient';
import { cn } from '@/lib/utils';
import { Settings2, X, AlertTriangle } from 'lucide-react';
import { getPriceK, formatPriceK } from '@/data/referencePrices';
import { ReorderAlert } from '@/hooks/useReorderAlerts';

interface IngredientCardProps {
  ingredient: Ingredient;
  isInOrder: boolean;
  orderQuantity?: number;
  onQuickAdd: (quantity: number) => void;
  onCustomQuantity: () => void;
  onEdit: () => void;
  onClear: () => void;
  reorderAlert?: ReorderAlert;
  isOutOfStock?: boolean;
  onReportOutOfStock?: () => void;
  reportMode?: boolean;
  remainingQuantity?: number | null;
  onReportRemaining?: () => void;
}

export function IngredientCard({
  ingredient,
  isInOrder,
  orderQuantity,
  onQuickAdd,
  onCustomQuantity,
  onEdit,
  onClear,
  reorderAlert,
  isOutOfStock,
  onReportOutOfStock,
  reportMode,
  remainingQuantity,
  onReportRemaining,
}: IngredientCardProps) {
  const unit = UNIT_LABELS[ingredient.unit];
  const priceK = getPriceK(ingredient.id);

  const handleQuickAdd = (qty: number) => {
    onQuickAdd(Math.round(((orderQuantity || 0) + qty) * 1000) / 1000);
  };

  const isAlerted = !!reorderAlert;

  // Report-only mode for kitchen members
  if (reportMode) {
    return (
      <div
        className={cn(
          "relative rounded-xl p-3 flex flex-col gap-2 transition-all duration-200 border-2 cursor-pointer",
          isOutOfStock
            ? "border-destructive bg-destructive/10"
            : remainingQuantity != null
              ? "border-primary/50 bg-primary/5"
              : "border-transparent bg-card shadow-sm"
        )}
        onClick={() => onReportRemaining?.()}
      >
        {/* Name row with remaining label */}
        <div className="flex items-center gap-1.5">
          <span className="text-xl leading-none">{ingredient.emoji}</span>
          <span className="text-[11px] font-bold text-card-foreground leading-tight truncate flex-1">
            {ingredient.name}
          </span>
          {remainingQuantity != null ? (
            <span className="text-[10px] font-extrabold text-primary bg-primary/10 rounded-full px-2 py-0.5 shrink-0">
              còn {remainingQuantity}{unit}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground/50 italic shrink-0">chưa báo</span>
          )}
        </div>

        {/* Report buttons */}
        {isOutOfStock ? (
          <div className="flex items-center gap-1.5 bg-destructive/15 text-destructive rounded-lg px-2.5 py-2.5 justify-center">
            <AlertTriangle size={14} />
            <span className="text-xs font-extrabold">Đã báo hết hàng</span>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onReportOutOfStock?.(); }}
            className="flex items-center gap-1.5 bg-muted hover:bg-destructive/15 hover:text-destructive text-muted-foreground rounded-lg px-2.5 py-2.5 justify-center transition-colors active:scale-95"
          >
            <AlertTriangle size={14} />
            <span className="text-xs font-bold">Báo hết hàng</span>
          </button>
        )}
      </div>
    );
  }

  // Chef mode (full ordering UI)
  return (
    <div
      className={cn(
        "relative rounded-xl p-3 flex flex-col gap-2 transition-all duration-200 border-2 cursor-pointer",
        isAlerted
          ? "border-[hsl(var(--reorder-glow))] bg-[hsl(var(--reorder-glow)/0.08)] shadow-[0_0_12px_hsl(var(--reorder-glow)/0.25)]"
          : isInOrder
            ? "border-primary bg-card shadow-md shadow-primary/15"
            : "border-transparent bg-card shadow-sm"
      )}
      onClick={onCustomQuantity}
    >
      {/* Order badge — click to clear */}
      {isInOrder && orderQuantity && (
        <button
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="absolute -top-2 -left-1.5 bg-primary text-primary-foreground text-[10px] font-extrabold rounded-full h-5 px-1.5 flex items-center justify-center shadow-md animate-pop-in gap-0.5 z-10 hover:bg-destructive transition-colors"
        >
          <span>{orderQuantity}{unit}</span>
          <X size={10} />
        </button>
      )}

      {/* Top row: emoji + name + price + edit */}
      <div className="flex items-center gap-1.5">
        <span className="text-xl leading-none">{ingredient.emoji}</span>
        {isAlerted && (
          <span className="bg-[hsl(0,65%,35%)] text-[hsl(0,100%,90%)] text-[8px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center shrink-0" title={reorderAlert.daysSinceLastOrder >= 999 ? 'Chưa mua' : `${reorderAlert.daysSinceLastOrder} ngày`}>
            {reorderAlert.daysSinceLastOrder >= 999 ? '!' : reorderAlert.daysSinceLastOrder}
          </span>
        )}
        <span className="text-[11px] font-bold text-card-foreground leading-tight truncate flex-1">
          {ingredient.name}
        </span>
        {priceK !== undefined && (
          <span className="text-[9px] text-muted-foreground/70 font-medium flex-shrink-0">
            {formatPriceK(priceK)}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          <Settings2 size={12} />
        </button>
      </div>

      {/* Bottom row: quick buttons + keypad + out of stock */}
      <div className="flex items-center gap-1.5">
        {ingredient.quickQuantities.map((qty, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); handleQuickAdd(qty); }}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 min-h-[36px]",
              isAlerted
                ? "bg-[hsl(var(--reorder-glow)/0.15)] text-[hsl(var(--reorder-glow))] hover:bg-[hsl(var(--reorder-glow)/0.25)]"
                : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
            )}
          >
            {qty}{unit}
          </button>
        ))}
      </div>
      {isOutOfStock && (
        <button
          onClick={(e) => { e.stopPropagation(); onReportOutOfStock?.(); }}
          className="flex items-center gap-1 bg-destructive/15 text-destructive rounded-lg px-2 py-1.5 hover:bg-destructive/25 transition-colors"
          title="Nhấn để xác nhận đã xem"
        >
          <AlertTriangle size={12} />
          <span className="text-[10px] font-extrabold">Hết hàng • Nhấn để xoá</span>
        </button>
      )}
    </div>
  );
}
