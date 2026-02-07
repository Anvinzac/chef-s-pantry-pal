import { Ingredient, UNIT_LABELS } from '@/types/ingredient';
import { cn } from '@/lib/utils';
import { Settings2, Keyboard, X } from 'lucide-react';

interface IngredientCardProps {
  ingredient: Ingredient;
  isInOrder: boolean;
  orderQuantity?: number;
  onQuickAdd: (quantity: number) => void;
  onCustomQuantity: () => void;
  onEdit: () => void;
  onClear: () => void;
}

export function IngredientCard({
  ingredient,
  isInOrder,
  orderQuantity,
  onQuickAdd,
  onCustomQuantity,
  onEdit,
  onClear,
}: IngredientCardProps) {
  const unit = UNIT_LABELS[ingredient.unit];

  const handleQuickAdd = (qty: number) => {
    if (isInOrder && orderQuantity === qty) {
      // Same button tapped again — accumulate
      onQuickAdd(orderQuantity + qty);
    } else {
      onQuickAdd(qty);
    }
  };

  return (
    <div
      className={cn(
        "relative bg-card rounded-xl px-2.5 py-2 flex items-center gap-2.5 transition-all duration-200 border-2",
        isInOrder
          ? "border-primary shadow-md shadow-primary/15"
          : "border-transparent shadow-sm"
      )}
    >
      {/* Emoji + Name — horizontal */}
      <div className="flex items-center gap-2 min-w-0 flex-shrink-0" onClick={onCustomQuantity}>
        <span className="text-2xl leading-none">{ingredient.emoji}</span>
        <div className="min-w-0">
          <span className="text-xs font-bold text-card-foreground leading-tight block truncate max-w-[72px]">
            {ingredient.name}
          </span>
          <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
            {unit}
          </span>
        </div>
      </div>

      {/* Quick buttons + actions */}
      <div className="flex items-center gap-1 ml-auto flex-shrink-0">
        {ingredient.quickQuantities.map((qty, i) => (
          <button
            key={i}
            onClick={() => handleQuickAdd(qty)}
            className={cn(
              "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95",
              isInOrder && orderQuantity === qty
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
            )}
          >
            {qty}{unit}
          </button>
        ))}

        {/* Keypad icon */}
        <button
          onClick={onCustomQuantity}
          className="p-1.5 rounded-lg text-secondary hover:text-secondary/80 hover:bg-muted transition-colors"
        >
          <Keyboard size={16} />
        </button>

        {/* Edit button */}
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Settings2 size={14} />
        </button>
      </div>

      {/* Order badge with clear */}
      {isInOrder && orderQuantity && (
        <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground text-[10px] font-extrabold rounded-full h-6 px-1.5 flex items-center justify-center shadow-md animate-pop-in gap-0.5">
          <span>{orderQuantity}{unit}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="ml-0.5 hover:bg-primary-foreground/20 rounded-full p-0.5"
          >
            <X size={10} />
          </button>
        </div>
      )}
    </div>
  );
}
