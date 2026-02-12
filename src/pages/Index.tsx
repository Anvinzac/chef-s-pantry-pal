import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categories } from '@/data/defaultIngredients';
import { Ingredient } from '@/types/ingredient';
import { useOrder } from '@/hooks/useOrder';
import { useOrderHistory } from '@/hooks/useOrderHistory';
import { useReorderAlerts } from '@/hooks/useReorderAlerts';
import { CategoryBar } from '@/components/chef/CategoryBar';
import { SubcategoryBar } from '@/components/chef/SubcategoryBar';
import { IngredientCard } from '@/components/chef/IngredientCard';
import { NumpadModal } from '@/components/chef/NumpadModal';
import { OrderBar } from '@/components/chef/OrderBar';
import { AddIngredientModal } from '@/components/chef/AddIngredientModal';
import { formatTomorrowDate, getSpecialDay } from '@/data/specialDays';
import { Plus, ChefHat, Clock, X } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const firstSubcategory = categories[0]?.subcategories?.[0]?.id ?? null;
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(firstSubcategory);
  const [numpadIngredient, setNumpadIngredient] = useState<Ingredient | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editIngredient, setEditIngredient] = useState<Ingredient | null>(null);

  const {
    ingredients,
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

  const { saveOrder } = useOrderHistory();
  const {
    getAlertCountForCategory,
    dismissCategory,
    isIngredientAlerted,
    highlightedCategory,
    clearHighlight,
  } = useReorderAlerts(ingredients);

  const { formatted: tomorrowFormatted, isoDate: tomorrowIso } = formatTomorrowDate();
  const specialDay = getSpecialDay(tomorrowIso);

  const activeCat = categories.find(c => c.id === activeCategory);
  const allCategoryIngredients = getIngredientsByCategory(activeCategory);
  const filteredIngredients = activeSubcategory
    ? allCategoryIngredients.filter(ing => ing.subcategory === activeSubcategory)
    : allCategoryIngredients;

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    const cat = categories.find(c => c.id === catId);
    setActiveSubcategory(cat?.subcategories?.[0]?.id ?? null);
  };

  // Build alert counts map
  const alertCounts: Record<string, number> = {};
  for (const cat of categories) {
    alertCounts[cat.id] = getAlertCountForCategory(cat.id);
  }

  const handleBadgeClick = (categoryId: string) => {
    dismissCategory(categoryId);
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
              <h1 className="font-extrabold text-base text-foreground leading-tight">Đặt Hàng Bếp</h1>
              <p className="text-[10px] text-muted-foreground font-semibold">Đặt nguyên liệu nhanh</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-bold text-foreground leading-tight">{tomorrowFormatted}</p>
              {specialDay && (
                <p className={`text-[9px] font-semibold leading-tight ${specialDay.impact === 'high' ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {specialDay.emoji} {specialDay.label}
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/history')}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <Clock size={18} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        <CategoryBar
          categories={categories}
          activeCategory={activeCategory}
          onSelect={handleCategoryChange}
          alertCounts={alertCounts}
          onBadgeClick={handleBadgeClick}
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

      {/* Highlight mode banner */}
      {highlightedCategory && highlightedCategory === activeCategory && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-xl bg-[hsl(var(--reorder-glow)/0.12)] border border-[hsl(var(--reorder-glow)/0.3)] flex items-center justify-between">
          <span className="text-xs font-bold text-[hsl(var(--reorder-glow))]">
            ⚡ Đang hiện nguyên liệu cần mua lại
          </span>
          <button onClick={clearHighlight} className="p-1 rounded-full hover:bg-muted">
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>
      )}

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
          Thêm
        </button>
      </div>

      {/* Ingredient grid */}
      <div className="px-3 pb-32 grid grid-cols-2 gap-1.5">
        {filteredIngredients.map(ingredient => {
          const orderItem = currentOrder.find(o => o.ingredientId === ingredient.id);
          const alert = isIngredientAlerted(ingredient.id);
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
              reorderAlert={alert}
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
        onSaveOrder={() => saveOrder(currentOrder, ingredients)}
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
