import { Recommendation } from '@/types/recommendation';
import { UNIT_LABELS } from '@/types/ingredient';
import { formatPriceK, getPriceK } from '@/data/referencePrices';
import { Button } from '@/components/ui/button';
import { Copy, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseIsoDate } from '@/lib/purchaseCycle';

interface Props {
  recommendation: Recommendation;
  onCopy: () => void;
  onDismiss: () => void;
  onDone: () => void;
  isInOrder: boolean;
}

function formatLastPurchase(iso: string): string {
  const date = parseIsoDate(iso.split('T')[0]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  return `${diffDays} ngày trước`;
}

export function RecommendationCard({ recommendation, onCopy, onDismiss, onDone, isInOrder }: Props) {
  const { ingredient, lastPurchaseDate, orderFrequencyDays, remainingCycle } = recommendation;
  const unit = UNIT_LABELS[ingredient.unit];
  const priceK = getPriceK(ingredient.id) ?? ingredient.referencePrice;
  const overdue = remainingCycle < 0;

  return (
    <div
      className={cn(
        'rounded-xl border p-3 flex flex-col gap-3 bg-card/50 transition-colors',
        overdue ? 'border-destructive/40' : 'border-border'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl leading-none shrink-0">{ingredient.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm leading-tight truncate">{ingredient.name}</div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatLastPurchase(lastPurchaseDate)}
            </span>
            <span>Chu kỳ: {orderFrequencyDays}d</span>
            {typeof priceK === 'number' && (
              <span>≈ {formatPriceK(priceK)}/{unit}</span>
            )}
          </div>
        </div>
        <div
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-xs font-bold',
            overdue ? 'bg-destructive text-destructive-foreground' : 'bg-amber-500/20 text-amber-700'
          )}
        >
          {overdue ? `Trễ ${Math.abs(remainingCycle).toFixed(1)}d` : `Còn ${remainingCycle.toFixed(1)}d`}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" onClick={onDismiss} className="h-9">
          Hoãn
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDone}
          className="h-9 border-emerald-500/50 text-emerald-700 hover:bg-emerald-500/10"
        >
          <Check className="w-4 h-4 mr-1" />
          Đã mua
        </Button>
        <Button size="sm" onClick={onCopy} disabled={isInOrder} className="h-9">
          <Copy className="w-4 h-4 mr-1" />
          {isInOrder ? 'Đã thêm' : 'Thêm'}
        </Button>
      </div>
    </div>
  );
}
