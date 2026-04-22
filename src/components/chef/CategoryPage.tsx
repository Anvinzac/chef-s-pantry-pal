import { Category, Ingredient } from '@/types/ingredient';
import { IngredientCard } from '@/components/chef/IngredientCard';
import { SubcategoryBar } from '@/components/chef/SubcategoryBar';
import { ReorderAlert } from '@/hooks/useReorderAlerts';
import { Plus } from 'lucide-react';

interface Props {
  category: Category;
  ingredients: Ingredient[];
  activeSubcategory: string | null;
  onSelectSubcategory: (subId: string | null) => void;
  isChef: boolean;
  editingEnabled: boolean;
  orderMap: Map<string, number>;
  isIngredientAlerted: (id: string) => ReorderAlert | null;
  isOutOfStock: (id: string) => boolean;
  getRemainingQuantity: (id: string) => number | null;
  onQuickAdd: (ingredient: Ingredient, qty: number) => void;
  onTapCard: (ingredient: Ingredient) => void;
  onEdit: (ingredient: Ingredient) => void;
  onClear: (ingredient: Ingredient) => void;
  onReportOutOfStock: (ingredient: Ingredient) => void;
  onReportRemaining: (ingredient: Ingredient) => void;
  onAddIngredient: () => void;
  onOpenStudio: () => void;
}

export function CategoryPage({
  category,
  ingredients,
  activeSubcategory,
  onSelectSubcategory,
  isChef,
  editingEnabled,
  orderMap,
  isIngredientAlerted,
  isOutOfStock,
  getRemainingQuantity,
  onQuickAdd,
  onTapCard,
  onEdit,
  onClear,
  onReportOutOfStock,
  onReportRemaining,
  onAddIngredient,
  onOpenStudio,
}: Props) {
  const filtered = activeSubcategory
    ? ingredients.filter(i => i.subcategory === activeSubcategory)
    : ingredients;

  return (
    <div className="h-full overflow-y-auto">
      {category.subcategories && category.subcategories.length > 0 && (
        <div className="px-4 pt-2">
          <SubcategoryBar
            subcategories={category.subcategories}
            activeSubcategory={activeSubcategory}
            onSelect={onSelectSubcategory}
          />
        </div>
      )}

      <div className="px-4 pt-2 pb-2 flex items-center justify-between">
        <h2 className="font-extrabold text-sm text-foreground flex items-center gap-2">
          <span>{category.emoji}</span>
          <span style={{ color: category.color }}>{category.name}</span>
          {activeSubcategory && (
            <span className="text-primary">
              › {category.subcategories?.find(s => s.id === activeSubcategory)?.name}
            </span>
          )}
          <span className="text-muted-foreground font-semibold">({filtered.length})</span>
        </h2>
        {isChef && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenStudio}
              className="px-3 py-1.5 rounded-full border border-border bg-card text-xs font-bold text-foreground active:scale-95 transition-transform"
            >
              Studio
            </button>
            <button
              onClick={onAddIngredient}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold active:scale-95 transition-transform"
            >
              <Plus size={14} />
              Thêm
            </button>
          </div>
        )}
      </div>

      <div className="px-3 pb-32 grid grid-cols-2 gap-1.5">
        {filtered.map(ingredient => {
          const orderQty = orderMap.get(ingredient.id);
          const inOrder = typeof orderQty === 'number';
          const alert = isIngredientAlerted(ingredient.id);
          const oos = isOutOfStock(ingredient.id);
          const handleQuickAdd = isChef && !editingEnabled
            ? (qty: number) => onQuickAdd(ingredient, qty)
            : () => {};
          const handleCardTap = isChef
            ? () => (editingEnabled ? onEdit(ingredient) : onTapCard(ingredient))
            : () => onReportRemaining(ingredient);
          return (
            <IngredientCard
              key={ingredient.id}
              ingredient={ingredient}
              isInOrder={isChef ? inOrder : false}
              orderQuantity={isChef ? orderQty : undefined}
              onQuickAdd={handleQuickAdd}
              onCustomQuantity={handleCardTap}
              onEdit={isChef ? () => onEdit(ingredient) : () => {}}
              onClear={isChef ? () => onClear(ingredient) : () => {}}
              reorderAlert={isChef && !inOrder ? alert ?? undefined : undefined}
              isOutOfStock={oos}
              onReportOutOfStock={() => onReportOutOfStock(ingredient)}
              reportMode={!isChef}
              remainingQuantity={getRemainingQuantity(ingredient.id)}
              onReportRemaining={() => onReportRemaining(ingredient)}
            />
          );
        })}
      </div>
    </div>
  );
}
