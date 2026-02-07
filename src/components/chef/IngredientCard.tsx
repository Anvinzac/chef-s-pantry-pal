import { Ingredient, UNIT_LABELS } from '@/types/ingredient';
import { cn } from '@/lib/utils';
import { Settings2 } from 'lucide-react';

interface IngredientCardProps {
  ingredient: Ingredient;
  isInOrder: boolean;
  orderQuantity?: number;
  onQuickAdd: (quantity: number) => void;
  onCustomQuantity: () => void;
  onEdit: () => void;
}

export function IngredientCard({
  ingredient,
  isInOrder,
  orderQuantity,
  onQuickAdd,
  onCustomQuantity,
  onEdit,
}: IngredientCardProps) {
  const unit = UNIT_LABELS[ingredient.unit];

  return (
    <div
      className={cn(
        "relative bg-card rounded-2xl p-3 flex flex-col items-center gap-1.5 transition-all duration-200 border-2",
        isInOrder
          ? "border-primary shadow-lg shadow-primary/15"
          : "border-transparent shadow-sm"
      )}
    >
      {/* Edit button */}
      <button
        onClick={onEdit}
        className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Settings2 size={14} />
      </button>

      {/* Order badge */}
      {isInOrder && orderQuantity && (
        <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground text-xs font-extrabold rounded-full w-7 h-7 flex items-center justify-center shadow-md animate-pop-in">
          {orderQuantity}{unit}
        </div>
      )}

      {/* Emoji */}
      <div className="text-3xl mt-1" onClick={onCustomQuantity}>
        {ingredient.emoji}
      </div>

      {/* Name */}
      <span className="text-xs font-bold text-center leading-tight line-clamp-2 text-card-foreground">
        {ingredient.name}
      </span>

      {/* Unit label */}
      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
        {unit}
      </span>

      {/* Quick buttons */}
      <div className="flex gap-1.5 w-full">
        {ingredient.quickQuantities.map((qty, i) => (
          <button
            key={i}
            onClick={() => onQuickAdd(qty)}
            className={cn(
              "flex-1 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95",
              isInOrder && orderQuantity === qty
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
            )}
          >
            {qty}{unit}
          </button>
        ))}
      </div>

      {/* Custom quantity tap area */}
      <button
        onClick={onCustomQuantity}
        className="w-full py-1 text-[10px] font-semibold text-secondary hover:text-secondary/80 transition-colors"
      >
        ⌨ custom
      </button>
    </div>
  );
}
