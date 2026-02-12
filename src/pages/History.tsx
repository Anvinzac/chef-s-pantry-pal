import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Filter } from 'lucide-react';
import { useOrderHistory, TimeRange, SavedOrder } from '@/hooks/useOrderHistory';
import { categories } from '@/data/defaultIngredients';
import { formatPriceK } from '@/data/referencePrices';
import { UNIT_LABELS, UnitOfMeasurement } from '@/types/ingredient';

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: 'week', label: '1 Tuần' },
  { value: '2weeks', label: '2 Tuần' },
  { value: 'month', label: '1 Tháng' },
  { value: 'quarter', label: 'Quý' },
  { value: 'year', label: '1 Năm' },
  { value: 'all', label: 'Tất Cả' },
];

const ALL_CATEGORIES = [
  { id: 'all', name: 'Tất Cả', emoji: '📋' },
  ...categories,
];

function groupOrdersByDate(orders: SavedOrder[]): Record<string, SavedOrder[]> {
  const groups: Record<string, SavedOrder[]> = {};
  for (const order of orders) {
    const date = order.order_date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(order);
  }
  return groups;
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return `${days[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function groupItemsByCategory(items: { category: string; name: string; quantity: number; unit: string; cost_k: number | null }[]) {
  const groups: Record<string, typeof items> = {};
  for (const item of items) {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  }
  return groups;
}

const History = () => {
  const navigate = useNavigate();
  const { orders, loading, fetchOrders } = useOrderHistory();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchOrders(timeRange, categoryFilter);
  }, [timeRange, categoryFilter, fetchOrders]);

  const grouped = groupOrdersByDate(orders);
  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-4 pt-3 pb-2 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="font-extrabold text-base text-foreground leading-tight">Lịch Sử Đặt Hàng</h1>
            <p className="text-[10px] text-muted-foreground font-semibold">Xem lại đơn đã đặt</p>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-2 space-y-2">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-muted-foreground flex-shrink-0" />
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {TIME_RANGES.map(tr => (
                <button
                  key={tr.value}
                  onClick={() => setTimeRange(tr.value)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${
                    timeRange === tr.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-muted-foreground flex-shrink-0" />
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {ALL_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${
                    categoryFilter === cat.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-3 py-3 pb-8 space-y-4">
        {loading && (
          <div className="text-center py-12 text-muted-foreground text-sm font-semibold">Đang tải...</div>
        )}

        {!loading && dateKeys.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm font-semibold">Không tìm thấy đơn hàng</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Thử thay đổi bộ lọc thời gian hoặc danh mục</p>
          </div>
        )}

        {dateKeys.map(dateKey => {
          const dayOrders = grouped[dateKey];
          const allItems = dayOrders.flatMap(o => o.items);
          const categoryGroups = groupItemsByCategory(allItems);
          const categoryKeys = Object.keys(categoryGroups);
          const dayTotal = allItems.reduce((sum, item) => sum + (item.cost_k ?? 0), 0);

          return (
            <div key={dateKey} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-extrabold text-sm text-foreground">
                  📅 {formatDateLabel(dateKey)}
                </h2>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  ~{formatPriceK(Math.round(dayTotal))}
                </span>
              </div>

              {categoryKeys.map(catKey => {
                const cat = categories.find(c => c.id === catKey);
                const items = categoryGroups[catKey];
                const catTotal = items.reduce((s, i) => s + (i.cost_k ?? 0), 0);

                return (
                  <div key={catKey} className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border">
                      <span className="text-xs font-bold text-foreground">
                        {cat?.emoji ?? '📦'} {cat?.name ?? catKey}
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        ~{formatPriceK(Math.round(catTotal * 10) / 10)}
                      </span>
                    </div>

                    <div className="divide-y divide-border">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between px-3 py-2">
                          <span className="text-xs font-semibold text-foreground flex-1 truncate">
                            {item.name}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium mx-2">
                            {item.quantity}{UNIT_LABELS[item.unit as UnitOfMeasurement] ?? item.unit}
                          </span>
                          {item.cost_k !== null && (
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                              ~{formatPriceK(Math.round(item.cost_k * 10) / 10)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default History;
