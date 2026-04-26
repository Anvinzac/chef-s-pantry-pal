import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { categories } from '@/data/defaultIngredients';
import { Ingredient } from '@/types/ingredient';
import { useOrder } from '@/hooks/useOrder';
import { useOrderHistory } from '@/hooks/useOrderHistory';
import { useReorderAlerts } from '@/hooks/useReorderAlerts';
import { useStockReports } from '@/hooks/useStockReports';
import { useStockRemaining } from '@/hooks/useStockRemaining';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { CategoryBar } from '@/components/chef/CategoryBar';
import { CategoryCloud } from '@/components/chef/CategoryCloud';
import { CategoryPage } from '@/components/chef/CategoryPage';
import { NumpadModal } from '@/components/chef/NumpadModal';
import { OrderBar } from '@/components/chef/OrderBar';
import { AddIngredientModal } from '@/components/chef/AddIngredientModal';
import { EditingModeToggle } from '@/components/chef/EditingModeToggle';
import { formatTomorrowDate, getSpecialDay } from '@/data/specialDays';
import { ChefHat, Clock, AlertTriangle, LogOut, Grid3X3, LogIn, UtensilsCrossed, Warehouse } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const { user, role, displayName, signOut, isGuest, restaurantId, restaurantName } = useAuth();
  const isChef = isGuest ? true : role === 'chef';
  const { editingEnabled } = useAppSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  const firstCategory = categories[0].id;
  const firstSubcategory = categories[0]?.subcategories?.[0]?.id ?? null;

  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
  const activeCategory = categories[activeCategoryIdx]?.id ?? firstCategory;
  const [subcategoryByCategory, setSubcategoryByCategory] = useState<Record<string, string | null>>({
    [firstCategory]: firstSubcategory,
  });

  const [numpadIngredient, setNumpadIngredient] = useState<Ingredient | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editIngredient, setEditIngredient] = useState<Ingredient | null>(null);
  const [categoryCloudOpen, setCategoryCloudOpen] = useState(false);
  const [remainingNumpadIngredient, setRemainingNumpadIngredient] = useState<Ingredient | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'x',
    loop: false,
    containScroll: 'trimSnaps',
    skipSnaps: false,
  });

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

  const { saveOrder } = useOrderHistory(restaurantId);
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
  } = useStockReports(restaurantId);

  const {
    reportRemaining,
    getRemainingQuantity,
  } = useStockRemaining(restaurantId);

  useEffect(() => {
    const cat = searchParams.get('category');
    const sub = searchParams.get('subcategory');
    if (cat) {
      const idx = categories.findIndex(c => c.id === cat);
      if (idx >= 0) {
        setActiveCategoryIdx(idx);
        emblaApi?.scrollTo(idx, true);
        const catObj = categories[idx];
        setSubcategoryByCategory(prev => ({
          ...prev,
          [cat]: sub ?? catObj.subcategories?.[0]?.id ?? null,
        }));
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap();
      setActiveCategoryIdx(idx);
      const catId = categories[idx].id;
      setSubcategoryByCategory(prev => {
        if (prev[catId] !== undefined) return prev;
        return { ...prev, [catId]: categories[idx].subcategories?.[0]?.id ?? null };
      });
    };
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  const handleCategorySelect = useCallback((catId: string) => {
    const idx = categories.findIndex(c => c.id === catId);
    if (idx < 0) return;
    setActiveCategoryIdx(idx);
    emblaApi?.scrollTo(idx);
  }, [emblaApi]);

  const handleSubcategorySelect = useCallback((catId: string, subId: string | null) => {
    setSubcategoryByCategory(prev => ({ ...prev, [catId]: subId }));
  }, []);

  const { formatted: tomorrowFormatted, isoDate: tomorrowIso } = formatTomorrowDate();
  const specialDay = getSpecialDay(tomorrowIso);

  const handleSaveOrder = useCallback(async () => {
    if (isGuest) {
      toast('Đăng nhập để lưu đơn hàng', {
        action: { label: 'Đăng nhập', onClick: () => navigate('/login') },
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

  const orderMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of currentOrder) m.set(o.ingredientId, o.quantity);
    return m;
  }, [currentOrder]);

  const alertCounts: Record<string, number> = {};
  for (const cat of categories) alertCounts[cat.id] = getAlertCountForCategory(cat.id);

  const commonCardHandlers = {
    orderMap,
    isIngredientAlerted,
    isOutOfStock,
    getRemainingQuantity,
    onQuickAdd: (ingredient: Ingredient, qty: number) => addToOrder(ingredient, qty),
    onTapCard: (ingredient: Ingredient) => setNumpadIngredient(ingredient),
    onEdit: (ingredient: Ingredient) => { setEditIngredient(ingredient); setAddModalOpen(true); },
    onClear: (ingredient: Ingredient) => removeFromOrder(ingredient.id),
    onReportOutOfStock: (ingredient: Ingredient) =>
      isChef ? resolveReport(ingredient.id) : reportOutOfStock(ingredient),
    onReportRemaining: (ingredient: Ingredient) => setRemainingNumpadIngredient(ingredient),
    onAddIngredient: () => { setEditIngredient(null); setAddModalOpen(true); },
    onOpenStudio: () => navigate('/ingredients-studio'),
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative flex flex-col">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="bg-primary rounded-xl p-1.5 active:scale-95 transition-transform"
              title="Trang chủ"
            >
              <ChefHat size={20} className="text-primary-foreground" />
            </button>
            <div>
              <h1 className="font-extrabold text-base text-foreground leading-tight">
                {isChef ? `Đặt hàng ${tomorrowFormatted}` : 'Báo Hết Hàng'}
              </h1>
              <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                {restaurantName ?? 'Đặt Hàng Bếp'}
                {isChef && specialDay && (
                  <span className={specialDay.impact === 'high' ? 'text-destructive' : ''}>
                    • {specialDay.emoji} {specialDay.label}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {isChef && (
              <button
                onClick={() => navigate('/menu')}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                title="Thực đơn"
              >
                <UtensilsCrossed size={18} className="text-muted-foreground" />
              </button>
            )}
            {isChef && (
              <button
                onClick={() => navigate('/inventory')}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                title="Kho bếp"
              >
                <Warehouse size={18} className="text-muted-foreground" />
              </button>
            )}
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
          onSelect={handleCategorySelect}
          alertCounts={isChef ? alertCounts : undefined}
        />

        <CategoryCloud
          categories={categories}
          activeCategory={activeCategory}
          onSelect={(catId) => { handleCategorySelect(catId); setCategoryCloudOpen(false); }}
          isOpen={categoryCloudOpen}
          alertCounts={isChef ? alertCounts : undefined}
        />

        <div className="flex items-center justify-end gap-1 px-4 pb-2">
          <button
            onClick={() => setCategoryCloudOpen(!categoryCloudOpen)}
            className="p-2.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors active:scale-95"
            title="Xem tất cả danh mục"
          >
            <Grid3X3 size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {categories.map(cat => {
            const catIngredients = getIngredientsByCategory(cat.id);
            const activeSub = subcategoryByCategory[cat.id] ?? cat.subcategories?.[0]?.id ?? null;
            return (
              <div
                key={cat.id}
                className="flex-shrink-0 flex-grow-0 basis-full min-w-0 h-full"
              >
                <CategoryPage
                  category={cat}
                  ingredients={catIngredients}
                  activeSubcategory={activeSub}
                  onSelectSubcategory={(subId) => handleSubcategorySelect(cat.id, subId)}
                  isChef={isChef}
                  editingEnabled={editingEnabled}
                  {...commonCardHandlers}
                />
              </div>
            );
          })}
        </div>
      </div>

      {isChef && (
        <OrderBar
          currentOrder={currentOrder}
          ingredients={ingredients}
          expanded={expandedOrder}
          onToggleExpand={() => setExpandedOrder(!expandedOrder)}
          onRemoveItem={removeFromOrder}
          onClearOrder={clearOrder}
          getOrderText={getOrderText}
          onSaveOrder={handleSaveOrder}
        />
      )}

      <NumpadModal
        ingredient={numpadIngredient}
        onConfirm={(qty) => numpadIngredient && addToOrder(numpadIngredient, qty)}
        onClose={() => setNumpadIngredient(null)}
      />

      <NumpadModal
        ingredient={remainingNumpadIngredient}
        onConfirm={(qty) => remainingNumpadIngredient && reportRemaining(remainingNumpadIngredient, qty)}
        onClose={() => setRemainingNumpadIngredient(null)}
      />

      <AddIngredientModal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); setEditIngredient(null); }}
        onAdd={addIngredient}
        onUpdate={updateIngredient}
        onDelete={deleteIngredient}
        editIngredient={editIngredient}
        categoryId={activeCategory}
      />

      <EditingModeToggle />
    </div>
  );
};

export default Index;
