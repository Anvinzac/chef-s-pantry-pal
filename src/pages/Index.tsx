import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { categories } from '@/data/defaultIngredients';
import { Ingredient } from '@/types/ingredient';
import { useOrder } from '@/hooks/useOrder';
import { useOrderHistory } from '@/hooks/useOrderHistory';
import { useReorderAlerts } from '@/hooks/useReorderAlerts';
import { useStockReports } from '@/hooks/useStockReports';
import { useStockRemaining } from '@/hooks/useStockRemaining';
import { useAuth } from '@/hooks/useAuth';
import { CategoryBar } from '@/components/chef/CategoryBar';
import { SubcategoryBar } from '@/components/chef/SubcategoryBar';
import { IngredientCard } from '@/components/chef/IngredientCard';
import { CategoryCloud } from '@/components/chef/CategoryCloud';
import { NumpadModal } from '@/components/chef/NumpadModal';
import { OrderBar } from '@/components/chef/OrderBar';
import { AddIngredientModal } from '@/components/chef/AddIngredientModal';
import { MenuPlanner } from '@/components/chef/MenuPlanner';
import { formatTomorrowDate, getSpecialDay } from '@/data/specialDays';
import { Plus, ChefHat, Clock, AlertTriangle, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const Index = () => {
  const navigate = useNavigate();
  const { role, displayName, signOut } = useAuth();
  const isChef = role === 'chef';
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const firstSubcategory = categories[0]?.subcategories?.[0]?.id ?? null;
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(firstSubcategory);
  const [numpadIngredient, setNumpadIngredient] = useState<Ingredient | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editIngredient, setEditIngredient] = useState<Ingredient | null>(null);
  const [activeView, setActiveView] = useState<'ingredients' | 'menu'>('ingredients');
  const [categoryCloudOpen, setCategoryCloudOpen] = useState(false);
  const [remainingNumpadIngredient, setRemainingNumpadIngredient] = useState<Ingredient | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userToggledRef = useRef(false);

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
    isIngredientAlerted,
    refreshAlerts,
  } = useReorderAlerts(ingredients);

  const {
    outOfStockCount,
    reportOutOfStock,
    resolveReport,
    isOutOfStock,
  } = useStockReports();

  const {
    reportRemaining,
    getRemainingQuantity,
  } = useStockRemaining();

  // Handle navigation from stock report page
  useEffect(() => {
    const cat = searchParams.get('category');
    const sub = searchParams.get('subcategory');
    if (cat) {
      setActiveCategory(cat);
      const catObj = categories.find(c => c.id === cat);
      setActiveSubcategory(sub ?? catObj?.subcategories?.[0]?.id ?? null);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Scroll to active view when user explicitly toggles
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const targetX = activeView === 'menu' ? 0 : container.clientWidth;
    container.scrollTo({ left: targetX, behavior: userToggledRef.current ? 'smooth' : 'auto' });
    userToggledRef.current = false;
  }, [activeView]);

  // Ensure ingredients panel is shown on mount
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    // Delay slightly to ensure layout is ready
    requestAnimationFrame(() => {
      container.scrollTo({ left: container.clientWidth, behavior: 'auto' });
    });
  }, []);

  // Detect scroll snap position to update active view
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const midPoint = container.scrollLeft + container.clientWidth / 2;
    if (midPoint < container.clientWidth) {
      if (activeView !== 'menu') setActiveView('menu');
    } else {
      if (activeView !== 'ingredients') setActiveView('ingredients');
    }
  };

  const { formatted: tomorrowFormatted, isoDate: tomorrowIso } = formatTomorrowDate();
  const specialDay = getSpecialDay(tomorrowIso);

  // Wrap saveOrder to refresh alerts after DB save
  const handleSaveOrder = useCallback(async () => {
    const result = await saveOrder(currentOrder, ingredients);
    if (result) {
      refreshAlerts();
    }
  }, [saveOrder, currentOrder, ingredients, refreshAlerts]);

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

  const alertCounts: Record<string, number> = {};
  for (const cat of categories) {
    alertCounts[cat.id] = getAlertCountForCategory(cat.id);
  }

  // Ingredients view content (extracted for clarity)
  const ingredientsContent = (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-xl p-1.5">
              <ChefHat size={20} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-foreground leading-tight">
                {isChef ? `Đặt hàng ${tomorrowFormatted}` : 'Báo Hết Hàng'}
              </h1>
              <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                Phạm Ngọc Thạch
                {isChef && specialDay && (
                  <span className={specialDay.impact === 'high' ? 'text-destructive' : ''}>
                    • {specialDay.emoji} {specialDay.label}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate('/stock-report')}
              className="relative p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <AlertTriangle size={18} className="text-muted-foreground" />
              {outOfStockCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center">
                  {outOfStockCount}
                </span>
              )}
            </button>
            {isChef && (
                <button
                  onClick={() => navigate('/history')}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <Clock size={18} className="text-muted-foreground" />
                </button>
            )}
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <LogOut size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        <CategoryBar
          categories={categories}
          activeCategory={activeCategory}
          onSelect={handleCategoryChange}
          alertCounts={isChef ? alertCounts : undefined}
        />

        {activeCat?.subcategories && activeCat.subcategories.length > 0 && (
          <SubcategoryBar
            subcategories={activeCat.subcategories}
            activeSubcategory={activeSubcategory}
            onSelect={setActiveSubcategory}
            onExpandCategories={() => setCategoryCloudOpen(true)}
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
        {isChef && (
          <button
            onClick={() => { setEditIngredient(null); setAddModalOpen(true); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold active:scale-95 transition-transform"
          >
            <Plus size={14} />
            Thêm
          </button>
        )}
      </div>

      {/* Ingredient grid */}
      <div className="px-3 pb-32 grid grid-cols-2 gap-1.5">
        {filteredIngredients.map(ingredient => {
          const orderItem = currentOrder.find(o => o.ingredientId === ingredient.id);
          const alert = isIngredientAlerted(ingredient.id);
          const outOfStock = isOutOfStock(ingredient.id);
          return (
            <IngredientCard
              key={ingredient.id}
              ingredient={ingredient}
              isInOrder={isChef ? !!orderItem : false}
              orderQuantity={isChef ? orderItem?.quantity : undefined}
              onQuickAdd={isChef ? (qty) => addToOrder(ingredient, qty) : () => {}}
              onCustomQuantity={isChef ? () => setNumpadIngredient(ingredient) : () => {}}
              onEdit={isChef ? () => { setEditIngredient(ingredient); setAddModalOpen(true); } : () => {}}
              onClear={isChef ? () => removeFromOrder(ingredient.id) : () => {}}
              reorderAlert={isChef && !orderItem ? alert : undefined}
              isOutOfStock={outOfStock}
              onReportOutOfStock={isChef ? () => resolveReport(ingredient.id) : () => reportOutOfStock(ingredient)}
              reportMode={!isChef}
              remainingQuantity={getRemainingQuantity(ingredient.id)}
              onReportRemaining={() => setRemainingNumpadIngredient(ingredient)}
            />
          );
        })}
      </div>
    </div>
  );

  // Non-chef: simple render without swipe
  if (!isChef) {
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto relative">
        {ingredientsContent}
        <NumpadModal
          ingredient={remainingNumpadIngredient}
          onConfirm={(qty) => remainingNumpadIngredient && reportRemaining(remainingNumpadIngredient, qty)}
          onClose={() => setRemainingNumpadIngredient(null)}
        />
        <CategoryCloud
          categories={categories}
          activeCategory={activeCategory}
          onSelect={handleCategoryChange}
          isOpen={categoryCloudOpen}
          onClose={() => setCategoryCloudOpen(false)}
        />
      </div>
    );
  }

  // Chef: swipeable container with menu planner
  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative overflow-hidden">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-screen"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {/* Menu Planner Panel */}
        <div className="w-full flex-shrink-0 snap-center h-screen overflow-y-auto">
          <MenuPlanner />
        </div>

        {/* Ingredients Panel */}
        <div className="w-full flex-shrink-0 snap-center h-screen overflow-y-auto relative">
          {ingredientsContent}

          {/* Order bar */}
          <OrderBar
            currentOrder={currentOrder}
            expanded={expandedOrder}
            onToggleExpand={() => setExpandedOrder(!expandedOrder)}
            onRemoveItem={removeFromOrder}
            onClearOrder={clearOrder}
            getOrderText={getOrderText}
            onSaveOrder={handleSaveOrder}
          />
        </div>
      </div>

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

      {/* Category cloud modal */}
      <CategoryCloud
        categories={categories}
        activeCategory={activeCategory}
        onSelect={handleCategoryChange}
        isOpen={categoryCloudOpen}
        onClose={() => setCategoryCloudOpen(false)}
        alertCounts={alertCounts}
      />
    </div>
  );
};

export default Index;
