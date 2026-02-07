import { useState } from 'react';
import { categories } from '@/data/defaultIngredients';
import { Ingredient } from '@/types/ingredient';
import { useOrder } from '@/hooks/useOrder';
import { CategoryBar } from '@/components/chef/CategoryBar';
import { SubcategoryBar } from '@/components/chef/SubcategoryBar';
import { IngredientCard } from '@/components/chef/IngredientCard';
import { NumpadModal } from '@/components/chef/NumpadModal';
import { OrderBar } from '@/components/chef/OrderBar';
import { AddIngredientModal } from '@/components/chef/AddIngredientModal';
import { Plus, ChefHat } from 'lucide-react';

const Index = () => {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [numpadIngredient, setNumpadIngredient] = useState<Ingredient | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editIngredient, setEditIngredient] = useState<Ingredient | null>(null);

  const {
    currentOrder,
    expandedOrder,
    setExpandedOrder,
    addToOrder,
    removeFromOrder,
    clearOrder,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    getOrderText,
    getIngredientsByCategory,
  } = useOrder();

  const activeCat = categories.find(c => c.id === activeCategory);
  const allCategoryIngredients = getIngredientsByCategory(activeCategory);
  const filteredIngredients = activeSubcategory
    ? allCategoryIngredients.filter(ing => ing.subcategory === activeSubcategory)
    : allCategoryIngredients;

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setActiveSubcategory(null);
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-xl p-1.5">
              <ChefHat size={20} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-foreground leading-tight">Chef's Order</h1>
              <p className="text-[10px] text-muted-foreground font-semibold">Quick ingredient ordering</p>
            </div>
          </div>
        </div>

        <CategoryBar
          categories={categories}
          activeCategory={activeCategory}
          onSelect={handleCategoryChange}
        />

        {/* Subcategory bar */}
        {activeCat?.subcategories && activeCat.subcategories.length > 0 && (
          <SubcategoryBar
            subcategories={activeCat.subcategories}
            activeSubcategory={activeSubcategory}
            onSelect={setActiveSubcategory}
          />
        )}
      </header>

      {/* Category header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h2 className="font-extrabold text-sm text-foreground flex items-center gap-2">
          <span>{activeCat?.emoji}</span>
          {activeCat?.name}
          {activeSubcategory && (
            <span className="text-primary">
              › {activeCat?.subcategories?.find(s => s.id === activeSubcategory)?.name}
            </span>
          )}
          <span className="text-muted-foreground font-semibold">({filteredIngredients.length})</span>
        </h2>
        <button
          onClick={() => { setEditIngredient(null); setAddModalOpen(true); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold active:scale-95 transition-transform"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Ingredient list — single column horizontal cards */}
      <div className="px-3 pb-32 grid grid-cols-2 gap-1.5">
        {filteredIngredients.map(ingredient => {
          const orderItem = currentOrder.find(o => o.ingredientId === ingredient.id);
          return (
            <IngredientCard
              key={ingredient.id}
              ingredient={ingredient}
              isInOrder={!!orderItem}
              orderQuantity={orderItem?.quantity}
              onQuickAdd={(qty) => addToOrder(ingredient, qty)}
              onCustomQuantity={() => setNumpadIngredient(ingredient)}
              onEdit={() => { setEditIngredient(ingredient); setAddModalOpen(true); }}
              onClear={() => removeFromOrder(ingredient.id)}
            />
          );
        })}
      </div>

      {/* Order bar */}
      <OrderBar
        currentOrder={currentOrder}
        expanded={expandedOrder}
        onToggleExpand={() => setExpandedOrder(!expandedOrder)}
        onRemoveItem={removeFromOrder}
        onClearOrder={clearOrder}
        getOrderText={getOrderText}
      />

      {/* Numpad modal */}
      <NumpadModal
        ingredient={numpadIngredient}
        onConfirm={(qty) => numpadIngredient && addToOrder(numpadIngredient, qty)}
        onClose={() => setNumpadIngredient(null)}
      />

      {/* Add/Edit ingredient modal */}
      <AddIngredientModal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); setEditIngredient(null); }}
        onAdd={addIngredient}
        onUpdate={updateIngredient}
        onDelete={deleteIngredient}
        editIngredient={editIngredient}
        categoryId={activeCategory}
      />
    </div>
  );
};

export default Index;
