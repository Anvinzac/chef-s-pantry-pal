import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { categories } from '@/data/defaultIngredients';
import { useDayWeights } from '@/hooks/useDayWeights';
import { useCategorySettings } from '@/hooks/useCategorySettings';
import { getDefaultDayWeight, toIsoDate, getWeightForDay } from '@/lib/purchaseCycle';
import { getMoonPhaseLabel } from '@/lib/moonPhase';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_WEIGHT = 2.0;
const WEEK_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

interface CalendarDay {
  date: Date;
  iso: string;
  inMonth: boolean;
}

function buildMonth(year: number, month: number): CalendarDay[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);
  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push({ date: d, iso: toIsoDate(d), inMonth: d.getMonth() === month });
  }
  return days;
}

const WeightCalendar = () => {
  const navigate = useNavigate();
  const { overrides, setWeight, clearWeight, setWeightForAllCategories, clearDate } = useDayWeights();
  const { settings, setDeliveryOffset } = useCategorySettings();
  const [categoryId, setCategoryId] = useState<string>('__all');
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const days = useMemo(() => buildMonth(cursor.year, cursor.month), [cursor]);

  const monthLabel = useMemo(() => {
    return new Date(cursor.year, cursor.month, 1).toLocaleDateString('vi-VN', {
      month: 'long',
      year: 'numeric',
    });
  }, [cursor]);

  const goPrev = () => setCursor(c => {
    const m = c.month - 1;
    return m < 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: m };
  });
  const goNext = () => setCursor(c => {
    const m = c.month + 1;
    return m > 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: m };
  });
  const goToday = () => {
    const d = new Date();
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const getCurrentWeight = (iso: string, date: Date): number => {
    if (categoryId === '__all') {
      const all = overrides[iso]?.__all;
      if (typeof all === 'number') return all;
      return getDefaultDayWeight(date);
    }
    return getWeightForDay(date, categoryId, overrides);
  };

  const hasOverride = (iso: string): boolean => {
    const day = overrides[iso];
    if (!day) return false;
    if (categoryId === '__all') return typeof day.__all === 'number';
    return typeof day[categoryId] === 'number';
  };

  const applyWeight = (iso: string, weight: number) => {
    if (categoryId === '__all') setWeightForAllCategories(iso, weight);
    else setWeight(iso, categoryId, weight);
  };

  const resetDay = (iso: string) => {
    if (categoryId === '__all') clearDate(iso);
    else clearWeight(iso, categoryId);
  };

  const todayIso = toIsoDate(new Date());
  const activeCategory = categories.find(c => c.id === categoryId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="font-bold text-base">Lịch Trọng Số</div>
            <div className="text-xs text-muted-foreground">Chu kỳ mua theo ngày</div>
          </div>
          <Button size="sm" variant="outline" onClick={goToday}>Hôm nay</Button>
        </div>

        <div className="px-4 pb-2 flex gap-1 overflow-x-auto">
          <CategoryChip
            active={categoryId === '__all'}
            emoji="🗓️"
            label="Tất cả"
            onClick={() => setCategoryId('__all')}
          />
          {categories.map(cat => (
            <CategoryChip
              key={cat.id}
              active={categoryId === cat.id}
              emoji={cat.emoji}
              label={cat.name}
              color={cat.color}
              onClick={() => setCategoryId(cat.id)}
            />
          ))}
        </div>

        <div className="px-4 pb-2 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={goPrev}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="font-bold capitalize">{monthLabel}</div>
          <Button variant="ghost" size="icon" onClick={goNext}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-3 pb-24">
        <div className="grid grid-cols-7 gap-1 mb-2 text-xs text-muted-foreground text-center font-bold">
          {WEEK_LABELS.map(label => <div key={label}>{label}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const weight = getCurrentWeight(day.iso, day.date);
            const overridden = hasOverride(day.iso);
            const moon = getMoonPhaseLabel(day.date);
            const isToday = day.iso === todayIso;
            return (
              <Popover key={day.iso}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      'relative h-16 rounded-lg border-2 p-1 flex flex-col items-start overflow-hidden transition-colors',
                      day.inMonth ? 'bg-card' : 'bg-muted/30 opacity-50',
                      isToday ? 'border-primary' : 'border-border',
                      overridden && 'ring-2 ring-primary/40'
                    )}
                  >
                    <WeightFill weight={weight} />
                    <div className="relative z-10 flex items-center justify-between w-full">
                      <span className={cn('text-xs font-bold', isToday && 'text-primary')}>
                        {day.date.getDate()}
                      </span>
                      {moon === 'new' && <span className="text-[10px]">🌑</span>}
                      {moon === 'full' && <span className="text-[10px]">🌕</span>}
                    </div>
                    <div className="relative z-10 mt-auto text-[11px] font-bold">
                      {weight.toFixed(1)}
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3">
                  <DayEditor
                    date={day.date}
                    weight={weight}
                    overridden={overridden}
                    onChange={w => applyWeight(day.iso, w)}
                    onReset={() => resetDay(day.iso)}
                  />
                </PopoverContent>
              </Popover>
            );
          })}
        </div>

        {activeCategory && (
          <div className="mt-6 p-3 rounded-xl border border-border bg-card space-y-2">
            <div className="font-bold text-sm flex items-center gap-2">
              <span className="text-xl">{activeCategory.emoji}</span>
              Giao hàng: {activeCategory.name}
            </div>
            <div className="text-xs text-muted-foreground">
              Độ lệch giao hàng (ngày). Item sẽ xuất hiện trong gợi ý khi chu kỳ còn lại nhỏ hơn 1 + độ lệch.
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.5"
                min="0"
                value={settings[activeCategory.id]?.deliveryOffset ?? 0}
                onChange={e => setDeliveryOffset(activeCategory.id, Number(e.target.value) || 0)}
                className="w-24 h-9"
              />
              <span className="text-xs text-muted-foreground">ngày</span>
            </div>
          </div>
        )}

        <div className="mt-6 p-3 rounded-xl border border-border bg-muted/30 text-xs text-muted-foreground space-y-1">
          <div className="font-bold text-foreground mb-1">Mặc định</div>
          <div>• Ngày thường: 1.0</div>
          <div>• Cuối tuần: 1.2</div>
          <div>• Trăng non / tròn: 1.8</div>
          <div>• Ngày nghỉ: 0.0 (đặt thủ công)</div>
        </div>
      </main>
    </div>
  );
};

function WeightFill({ weight }: { weight: number }) {
  const pct = Math.min(100, (weight / MAX_WEIGHT) * 100);
  const color =
    weight === 0 ? 'hsl(0, 0%, 80%)' :
    weight >= 1.5 ? 'hsl(0, 72%, 55%)' :
    weight >= 1.1 ? 'hsl(32, 90%, 52%)' :
    weight >= 0.9 ? 'hsl(145, 65%, 42%)' :
    'hsl(210, 40%, 70%)';
  return (
    <div
      className="absolute inset-x-0 bottom-0 transition-all"
      style={{ height: `${pct}%`, background: color, opacity: 0.25 }}
    />
  );
}

function CategoryChip({
  active, emoji, label, color, onClick,
}: {
  active: boolean;
  emoji: string;
  label: string;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border-2 transition-colors flex items-center gap-1 shrink-0',
        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'
      )}
      style={active && color ? { background: color, borderColor: color, color: 'white' } : undefined}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

function DayEditor({
  date, weight, overridden, onChange, onReset,
}: {
  date: Date;
  weight: number;
  overridden: boolean;
  onChange: (weight: number) => void;
  onReset: () => void;
}) {
  const dateLabel = date.toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const presets = [0, 1.0, 1.2, 1.8];

  return (
    <div className="space-y-3">
      <div>
        <div className="font-bold text-sm capitalize">{dateLabel}</div>
        <div className="text-xs text-muted-foreground">
          {overridden ? 'Trọng số tuỳ chỉnh' : 'Trọng số mặc định'}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold">{weight.toFixed(1)}</div>
        <Button variant="ghost" size="sm" onClick={onReset} disabled={!overridden}>
          <RotateCcw className="w-3 h-3 mr-1" /> Mặc định
        </Button>
      </div>

      <Slider
        min={0}
        max={MAX_WEIGHT}
        step={0.1}
        value={[weight]}
        onValueChange={([v]) => onChange(v)}
      />

      <div className="flex gap-1">
        {presets.map(p => (
          <Button
            key={p}
            variant={Math.abs(weight - p) < 0.01 ? 'default' : 'outline'}
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => onChange(p)}
          >
            {p.toFixed(1)}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default WeightCalendar;
