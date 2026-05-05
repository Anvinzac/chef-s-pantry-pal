import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useOrder } from '@/hooks/useOrder';
import { useDismissals } from '@/hooks/useDismissals';
import { useAuth } from '@/hooks/useAuth';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { CategoryCard } from '@/components/chef/CategoryCard';
import { Button } from '@/components/ui/button';
import { Ingredient } from '@/types/ingredient';
import { ChefHat, ShoppingBasket, Calendar, LogOut, LogIn, Sparkles, FlaskConical, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { seedDemoIngredients } from '@/lib/seedDemoData';

const Recommendations = () => {
  const navigate = useNavigate();
  const { user, displayName, restaurantName, signOut, isGuest } = useAuth();
  const { isMobile } = useBreakpoint();
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
  const focusedIdRef = useRef<string | null>(null);
  focusedIdRef.current = focusedCategoryId;

  const groupIds = useMemo(() => groups.map(g => g.categoryId), [groups]);
  const groupIdsRef = useRef(groupIds);
  groupIdsRef.current = groupIds;

  // Per-cell trigger lines, measured down from the scroll container's top.
  // The top two cells use a higher (closer-to-header) line so they can be
  // reached without scrolling much. From the third cell onward, the trigger
  // line is lower — cells expand earlier as they're scrolled into view, and
  // by the time scrolling settles their top edge has naturally arrived just
  // beneath the header.
  const TRIGGER_HEAD_OFFSET = 96;
  const TRIGGER_BODY_OFFSET = 260;
  const triggerOffsetForIndex = (i: number) =>
    i < 2 ? TRIGGER_HEAD_OFFSET : TRIGGER_BODY_OFFSET;

  useEffect(() => {
    if (groupIds.length === 0) {
      setFocusedCategoryId(null);
      return;
    }
    if (!focusedCategoryId || !groupIds.includes(focusedCategoryId)) {
      setFocusedCategoryId(groupIds[0]);
    }
  }, [groupIds, focusedCategoryId]);

  const programmaticScrollRef = useRef(false);
  const gestureStartRef = useRef<{ top: number; time: number; focusedId: string | null } | null>(null);
  const lastScrollTopRef = useRef(0);
  const scrollEndTimerRef = useRef<number | null>(null);
  const focusRafRef = useRef<number | null>(null);

  const computeFocusFromThreshold = (): string | null => {
    const container = scrollRef.current;
    if (!container) return null;
    const ids = groupIdsRef.current;
    if (ids.length === 0) return null;
    const containerTop = container.getBoundingClientRect().top;
    const currentIdx = focusedIdRef.current
      ? ids.indexOf(focusedIdRef.current)
      : 0;
    if (currentIdx < 0) return ids[0];

    // Step at most one neighbor per call. Each scroll tick can advance or
    // retreat by one cell; the next tick re-evaluates against the layout
    // that just shifted from the expand/collapse animation. This keeps
    // focus walking the list one card at a time rather than leaping
    // several cards forward when many collapsed cells happen to sit above
    // the lower trigger line.
    const triggerYAt = (i: number) => containerTop + triggerOffsetForIndex(i);

    const nextIdx = currentIdx + 1;
    if (nextIdx < ids.length) {
      const el = cardRefs.current.get(ids[nextIdx]);
      if (el && el.getBoundingClientRect().top <= triggerYAt(nextIdx)) {
        return ids[nextIdx];
      }
    }

    if (currentIdx > 0) {
      const el = cardRefs.current.get(ids[currentIdx]);
      if (el && el.getBoundingClientRect().top > triggerYAt(currentIdx)) {
        return ids[currentIdx - 1];
      }
    }

    return ids[currentIdx];
  };

  const scrollToCategory = (id: string) => {
    const el = cardRefs.current.get(id);
    const container = scrollRef.current;
    if (!el || !container) return;
    const idx = groupIdsRef.current.indexOf(id);
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    // Land the card's top at its own trigger line so it stays focused.
    const delta =
      elRect.top - (containerRect.top + triggerOffsetForIndex(idx)) + 1;
    programmaticScrollRef.current = true;
    setFocusedCategoryId(id);
    container.scrollBy({ top: delta, behavior: 'smooth' });
    window.setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 500);
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const onScroll = () => {
      if (programmaticScrollRef.current) return;

      // Cheap synchronous bookkeeping — must not be deferred or the
      // gesture-start snapshot would race with the next scroll burst.
      const now = performance.now();
      const top = container.scrollTop;
      if (!gestureStartRef.current) {
        gestureStartRef.current = {
          top: lastScrollTopRef.current,
          time: now,
          focusedId: focusedIdRef.current,
        };
      }
      lastScrollTopRef.current = top;

      // Coalesce the expensive layout read + focus state update into one
      // call per animation frame. Scroll fires far faster than paint;
      // running getBoundingClientRect on every event was the dominant
      // cost in this hot path.
      if (focusRafRef.current === null) {
        focusRafRef.current = requestAnimationFrame(() => {
          focusRafRef.current = null;
          const next = computeFocusFromThreshold();
          if (next) setFocusedCategoryId(prev => (prev === next ? prev : next));
        });
      }

      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = window.setTimeout(handleScrollEnd, 130);
    };

    const handleScrollEnd = () => {
      const start = gestureStartRef.current;
      gestureStartRef.current = null;
      if (!start || programmaticScrollRef.current) return;
      const distance = container.scrollTop - start.top;
      const duration = Math.max(performance.now() - start.time, 1);
      const speed = Math.abs(distance) / duration; // px/ms

      const ids = groupIdsRef.current;
      const focused = focusedIdRef.current;
      if (!focused || ids.length === 0) return;
      const idx = ids.indexOf(focused);
      if (idx < 0) return;

      const absDist = Math.abs(distance);
      // A "flick" is a tiny intentional nudge — clearly directional but
      // far too small to have crossed the threshold on its own. The user
      // is asking to step one card. Anything bigger should let the
      // threshold logic and natural scroll inertia decide.
      const MIN_DISTANCE = 8;
      const FLICK_MAX_DISTANCE = 80;

      const focusChanged = start.focusedId !== focused;
      const isFlickIntent =
        !focusChanged &&
        absDist >= MIN_DISTANCE &&
        absDist <= FLICK_MAX_DISTANCE;

      // Only snap on a flick whose threshold-based focus change didn't
      // happen — the user clearly wanted to move but didn't scroll far
      // enough. Otherwise leave the scroll position alone: the lower
      // trigger line means the resting position naturally has the focused
      // card's top below the header.
      if (!isFlickIntent) return;
      const direction = distance > 0 ? 1 : -1;
      const targetIdx = Math.max(
        0,
        Math.min(ids.length - 1, idx + direction)
      );
      const targetId = ids[targetIdx];
      if (targetId && targetIdx !== idx) scrollToCategory(targetId);
    };

    // Don't call onScroll() on mount: with every cell still collapsed at
    // first paint, multiple cards' tops sit above the lower trigger and
    // the threshold logic would wrongly focus a deep cell instead of the
    // first one. Wait for the user's first real scroll, by which time the
    // top cell has expanded and the layout reflects reality.
    container.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      container.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
      if (focusRafRef.current !== null) {
        cancelAnimationFrame(focusRafRef.current);
        focusRafRef.current = null;
      }
    };
  }, [groupIds]);

  const registerCardRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  };

  return (
    <div className={`h-screen bg-background flex flex-col overflow-hidden ${isMobile ? 'max-w-md mx-auto' : 'w-full'}`}>
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
            {/* Trailing space so the last card can scroll up to the trigger
                line and become the focused/expanded one. */}
            <div aria-hidden className="h-[70vh]" />
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
