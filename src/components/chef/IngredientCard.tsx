import { Ingredient, UNIT_LABELS } from '@/types/ingredient';
import { cn } from '@/lib/utils';
import { Settings2, Keyboard, X } from 'lucide-react';
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
}: IngredientCardProps) {
  const unit = UNIT_LABELS[ingredient.unit];
  const priceK = getPriceK(ingredient.id);

  const handleQuickAdd = (qty: number) => {
    onQuickAdd(Math.round(((orderQuantity || 0) + qty) * 1000) / 1000);
  };

  const isAlerted = !!reorderAlert;

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

      {/* Reorder alert tag */}
      {isAlerted && (
        <span className="absolute -top-2 -right-1.5 bg-[hsl(var(--reorder-glow))] text-[hsl(220,30%,15%)] text-[9px] font-extrabold rounded-full h-5 px-1.5 flex items-center justify-center shadow-md animate-pop-in z-10">
          {reorderAlert.daysSinceLastOrder >= 999 ? 'Chưa mua' : `${reorderAlert.daysSinceLastOrder}d`}
        </span>
      )}

      {/* Top row: emoji + name + edit */}
      <div className="flex items-center gap-1.5">
        <span className="text-xl leading-none">{ingredient.emoji}</span>
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

      {/* Bottom row: quick buttons + keypad */}
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
        <button
          onClick={(e) => { e.stopPropagation(); onCustomQuantity(); }}
          className="p-2 rounded-lg text-secondary hover:bg-muted transition-colors flex-shrink-0 min-h-[36px] flex items-center justify-center"
        >
          <Keyboard size={16} />
        </button>
      </div>
    </div>
  );
}
