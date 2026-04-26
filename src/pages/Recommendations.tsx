import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useOrder } from '@/hooks/useOrder';
import { useDismissals } from '@/hooks/useDismissals';
import { useAuth } from '@/hooks/useAuth';
import { CategoryCard } from '@/components/chef/CategoryCard';
import { Button } from '@/components/ui/button';
import { Ingredient } from '@/types/ingredient';
import { ChefHat, ShoppingBasket, Calendar, LogOut, LogIn, Sparkles, FlaskConical, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { seedDemoIngredients } from '@/lib/seedDemoData';

const Recommendations = () => {
  const navigate = useNavigate();
  const { user, displayName, restaurantName, signOut, isGuest } = useAuth();
  const groups = useRecommendations();
  const { addToOrder, currentOrder, ingredients, updateIngredient, replaceIngredients } = useOrder();
  const { dismiss } = useDismissals();

  const totalCount = useMemo(
    () => groups.reduce((sum, g) => sum + g.items.length, 0),
    [groups]
  );

  const inOrderIds = useMemo(() => new Set(currentOrder.map(o => o.ingredientId)), [currentOrder]);

  const handleCopy = (ingredient: Ingredient) => {
    const quantity = ingredient.lastOrderedQuantity ?? ingredient.quickQuantities?.[0] ?? 1;
    addToOrder(ingredient, quantity);
    toast.success(`Đã thêm ${ingredient.name} vào đơn hàng`);
  };

  const handleDismiss = (ingredient: Ingredient) => {
    dismiss(ingredient.id);
    toast(`Đã hoãn ${ingredient.name} tới ngày mai`);
  };

  const handleDone = (ingredient: Ingredient) => {
    updateIngredient(ingredient.id, { lastOrderDate: new Date().toISOString() });
    toast.success(`Đã đánh dấu ${ingredient.name} là đã mua`);
  };

  const handleSeed = () => {
    replaceIngredients(seedDemoIngredients(ingredients));
    toast.success('Đã tải dữ liệu mẫu');
  };

  const today = new Date();
  const dateLabel = today.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const scrollRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [focusedCategoryId, setFocusedCategoryId] = useState<string | null>(null);

  const groupIds = useMemo(() => groups.map(g => g.categoryId), [groups]);

  useEffect(() => {
    if (groupIds.length === 0) {
      setFocusedCategoryId(null);
      return;
    }
    if (!focusedCategoryId || !groupIds.includes(focusedCategoryId)) {
      setFocusedCategoryId(groupIds[0]);
    }
  }, [groupIds, focusedCategoryId]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const computeFocus = () => {
      const rect = container.getBoundingClientRect();
      const centerY = rect.top + rect.height * 0.5;
      let bestId: string | null = null;
      let bestDist = Infinity;
      cardRefs.current.forEach((el, id) => {
        const r = el.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        const dist = Math.abs(mid - centerY);
        if (dist < bestDist) {
          bestDist = dist;
          bestId = id;
        }
      });
      if (bestId) setFocusedCategoryId(prev => (prev === bestId ? prev : bestId));
    };

    computeFocus();
    container.addEventListener('scroll', computeFocus, { passive: true });
    window.addEventListener('resize', computeFocus);
    return () => {
      container.removeEventListener('scroll', computeFocus);
      window.removeEventListener('resize', computeFocus);
    };
  }, [groupIds]);

  const registerCardRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  };

  const scrollToCategory = (id: string) => {
    const el = cardRefs.current.get(id);
    const container = scrollRef.current;
    if (!el || !container) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const delta = (elRect.top + elRect.height / 2) - (containerRect.top + containerRect.height / 2);
    container.scrollBy({ top: delta, behavior: 'smooth' });
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="shrink-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-base leading-tight truncate">Gợi Ý Hôm Nay</div>
              <div className="text-xs text-muted-foreground leading-tight truncate capitalize">
                {dateLabel}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/weight-calendar')}
              title="Lịch trọng số"
            >
              <Calendar className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/order')}
              title="Đặt hàng"
            >
              <ShoppingBasket className="w-5 h-5" />
            </Button>
            {user && !isGuest ? (
              <Button variant="ghost" size="icon" onClick={signOut} title="Đăng xuất">
                <LogOut className="w-5 h-5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => navigate('/login')} title="Đăng nhập">
                <LogIn className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
        {(user || isGuest) && (
          <div className="px-4 pb-2 text-xs text-muted-foreground flex items-center gap-1">
            <ChefHat className="w-3 h-3" />
            {displayName ?? 'Khách'}
            {restaurantName && <span>· {restaurantName}</span>}
          </div>
        )}
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {totalCount === 0 ? (
          <EmptyState onSeed={handleSeed} />
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {totalCount} nguyên liệu · {groups.length} danh mục cần chú ý hôm nay
            </div>
            {groups.map(group => (
              <div key={group.categoryId} ref={registerCardRef(group.categoryId)}>
                <CategoryCard
                  group={group}
                  expanded={focusedCategoryId === group.categoryId}
                  onActivate={() => scrollToCategory(group.categoryId)}
                  inOrderIds={inOrderIds}
                  onCopy={handleCopy}
                  onDismiss={handleDismiss}
                  onDone={handleDone}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-4 right-4 left-4 flex justify-end gap-2 pointer-events-none">
        <Button
          size="lg"
          variant="outline"
          className="pointer-events-auto shadow-lg rounded-full"
          onClick={() => navigate('/inventory')}
        >
          <Warehouse className="w-5 h-5 mr-2" />
          Kho bếp
        </Button>
        <Button
          size="lg"
          className="pointer-events-auto shadow-lg rounded-full"
          onClick={() => navigate('/order')}
        >
          <ShoppingBasket className="w-5 h-5 mr-2" />
          Đơn hàng {currentOrder.length > 0 && `(${currentOrder.length})`}
        </Button>
      </div>
    </div>
  );
};

function EmptyState({ onSeed }: { onSeed: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 gap-3 text-muted-foreground">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-emerald-500" />
      </div>
      <div className="font-bold text-foreground">Không có gợi ý nào hôm nay</div>
      <div className="text-sm max-w-xs">
        Tất cả nguyên liệu đều còn trong chu kỳ mua. Kiểm tra lại vào ngày mai.
      </div>
      <Button variant="outline" size="sm" className="mt-4" onClick={onSeed}>
        <FlaskConical className="w-4 h-4 mr-2" />
        Tải dữ liệu mẫu
      </Button>
    </div>
  );
}

export default Recommendations;
