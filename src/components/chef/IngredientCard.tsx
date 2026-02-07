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
    onQuickAdd((orderQuantity || 0) + qty);
  };

  return (
    <div
      className={cn(
        "relative bg-card rounded-xl p-2 flex flex-col gap-1 transition-all duration-200 border-2",
        isInOrder
          ? "border-primary shadow-md shadow-primary/15"
          : "border-transparent shadow-sm"
      )}
    >
      {/* Order badge with clear */}
      {isInOrder && orderQuantity && (
        <div className="absolute -top-2 -left-1.5 bg-primary text-primary-foreground text-[10px] font-extrabold rounded-full h-5 px-1.5 flex items-center justify-center shadow-md animate-pop-in gap-0.5 z-10">
          <span>{orderQuantity}{unit}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="ml-0.5 hover:bg-primary-foreground/20 rounded-full"
          >
            <X size={9} />
          </button>
        </div>
      )}

      {/* Top row: emoji + name + edit */}
      <div className="flex items-center gap-1.5">
        <span className="text-xl leading-none" onClick={onCustomQuantity}>{ingredient.emoji}</span>
        <span className="text-[11px] font-bold text-card-foreground leading-tight truncate flex-1">
          {ingredient.name}
        </span>
        <button
          onClick={onEdit}
          className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          <Settings2 size={12} />
        </button>
      </div>

      {/* Bottom row: quick buttons + keypad */}
      <div className="flex items-center gap-1">
        {ingredient.quickQuantities.map((qty, i) => (
          <button
            key={i}
            onClick={() => handleQuickAdd(qty)}
            className="flex-1 py-1 rounded-lg text-[11px] font-bold transition-all duration-150 active:scale-95 bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
          >
            {qty}{unit}
          </button>
        ))}
        <button
          onClick={onCustomQuantity}
          className="p-1 rounded-lg text-secondary hover:bg-muted transition-colors flex-shrink-0"
        >
          <Keyboard size={14} />
        </button>
      </div>
    </div>
  );
}
