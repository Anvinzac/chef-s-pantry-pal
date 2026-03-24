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
import { Plus, ChefHat, Clock, AlertTriangle, LogOut, Grid3X3, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const SWIPE_THRESHOLD = 50;

const Index = () => {
  const navigate = useNavigate();
  const { user, role, displayName, signOut, isGuest } = useAuth();
  const isChef = isGuest ? true : role === 'chef';
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

  // Touch swipe refs
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchAxisRef = useRef<'horizontal' | 'vertical' | null>(null);

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

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchAxisRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);
    // Lock axis on first significant movement
    if (!touchAxisRef.current && (dx > 10 || dy > 10)) {
      touchAxisRef.current = dx > dy ? 'horizontal' : 'vertical';
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || touchAxisRef.current !== 'horizontal') {
      touchStartRef.current = null;
      touchAxisRef.current = null;
      return;
    }
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;

    // Ingredients -> Menu on left swipe, Menu -> Ingredients on right swipe
    if (deltaX < -SWIPE_THRESHOLD && activeView === 'ingredients') {
      setActiveView('menu');
    } else if (deltaX > SWIPE_THRESHOLD && activeView === 'menu') {
      setActiveView('ingredients');
    }

    touchStartRef.current = null;
    touchAxisRef.current = null;
  };

  const { formatted: tomorrowFormatted, isoDate: tomorrowIso } = formatTomorrowDate();
  const specialDay = getSpecialDay(tomorrowIso);

  // Save order, clear cart, refresh alerts
  const handleSaveOrder = useCallback(async () => {
    if (isGuest) {
      toast('Đăng nhập để lưu đơn hàng', {
        action: {
          label: 'Đăng nhập',
          onClick: () => navigate('/login'),
        },
      });
      return;
    }
    const result = await saveOrder(currentOrder, ingredients);
    if (result) {
      clearOrder();
      setExpandedOrder(false);
      refreshAlerts();
    }
  }, [isGuest, navigate, saveOrder, currentOrder, ingredients, refreshAlerts, clearOrder, setExpandedOrder]);

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
            {!isGuest && (
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
            )}
            {isChef && !isGuest && (
                <button
                  onClick={() => navigate('/history')}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <Clock size={18} className="text-muted-foreground" />
                </button>
            )}
            {isGuest ? (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
              >
                <LogIn size={14} />
                Đăng nhập
              </button>
            ) : (
              <button
                onClick={signOut}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <LogOut size={16} className="text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <CategoryBar
          categories={categories}
          activeCategory={activeCategory}
          onSelect={handleCategoryChange}
          alertCounts={isChef ? alertCounts : undefined}
        />

        <CategoryCloud
          categories={categories}
          activeCategory={activeCategory}
          onSelect={(catId) => { handleCategoryChange(catId); setCategoryCloudOpen(false); }}
          isOpen={categoryCloudOpen}
          alertCounts={isChef ? alertCounts : undefined}
        />

        <div className="flex items-center gap-1 px-4 pb-2">
          {activeCat?.subcategories && activeCat.subcategories.length > 0 && (
            <div className="flex-1 overflow-hidden">
              <SubcategoryBar
                subcategories={activeCat.subcategories}
                activeSubcategory={activeSubcategory}
                onSelect={setActiveSubcategory}
              />
            </div>
          )}
          <button
            onClick={() => setCategoryCloudOpen(!categoryCloudOpen)}
            className="p-2.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors shrink-0 active:scale-95"
            title="Xem tất cả danh mục"
          >
            <Grid3X3 size={18} />
          </button>
        </div>
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
      </div>
    );
  }

  // Chef: transform-based swipeable container (no scroll-snap to avoid hit-test offset)
  return (
    <div
      className="min-h-screen bg-background max-w-md mx-auto relative overflow-hidden"
      style={{ touchAction: 'pan-y' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex h-screen transition-transform duration-300 ease-out"
        style={{
          width: '200%',
          transform: `translateX(${activeView === 'menu' ? '-50%' : '0%'})`,
        }}
      >
        {/* Ingredients Panel */}
        <div className={cn("w-1/2 flex-shrink-0 h-screen overflow-y-auto", activeView !== 'ingredients' && "pointer-events-none")}>
          {ingredientsContent}
        </div>

        {/* Menu Planner Panel */}
        <div className={cn("w-1/2 flex-shrink-0 h-screen overflow-y-auto", activeView !== 'menu' && "pointer-events-none")}>
          <MenuPlanner />
        </div>
      </div>

      {/* Order bar - fixed outside scroll panels */}
      {activeView === 'ingredients' && (
        <OrderBar
          currentOrder={currentOrder}
          expanded={expandedOrder}
          onToggleExpand={() => setExpandedOrder(!expandedOrder)}
          onRemoveItem={removeFromOrder}
          onClearOrder={clearOrder}
          getOrderText={getOrderText}
          onSaveOrder={handleSaveOrder}
        />
      )}

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
