import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useOrder } from '@/hooks/useOrder';
import { useDismissals } from '@/hooks/useDismissals';
import { useAuth } from '@/hooks/useAuth';
import { RecommendationCard } from '@/components/chef/RecommendationCard';
import { Button } from '@/components/ui/button';
import { Ingredient } from '@/types/ingredient';
import { ChefHat, ShoppingBasket, Calendar, LogOut, LogIn, Sparkles, FlaskConical } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
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

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {totalCount === 0 ? (
          <EmptyState onSeed={handleSeed} />
        ) : (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">
              {totalCount} nguyên liệu cần chú ý hôm nay
            </div>
            {groups.map(group => (
              <section key={group.categoryId} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{group.categoryEmoji}</span>
                  <h2 className="font-bold text-base" style={{ color: group.categoryColor }}>
                    {group.categoryName}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    · {group.items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.items.map(rec => (
                    <RecommendationCard
                      key={rec.ingredient.id}
                      recommendation={rec}
                      isInOrder={inOrderIds.has(rec.ingredient.id)}
                      onCopy={() => handleCopy(rec.ingredient)}
                      onDismiss={() => handleDismiss(rec.ingredient)}
                      onDone={() => handleDone(rec.ingredient)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-4 right-4 left-4 flex justify-end pointer-events-none">
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
