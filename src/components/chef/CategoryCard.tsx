import { RecommendationGroup } from '@/types/recommendation';
import { Ingredient } from '@/types/ingredient';
import { RecommendationCard } from './RecommendationCard';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface Props {
  group: RecommendationGroup;
  expanded: boolean;
  onActivate: () => void;
  inOrderIds: Set<string>;
  onCopy: (ingredient: Ingredient) => void;
  onDismiss: (ingredient: Ingredient) => void;
  onDone: (ingredient: Ingredient) => void;
}

export function CategoryCard({
  group,
  expanded,
  onActivate,
  inOrderIds,
  onCopy,
  onDismiss,
  onDone,
}: Props) {
  const worstOverdue = group.items.reduce(
    (acc, r) => Math.min(acc, r.remainingCycle),
    Infinity
  );
  const isOverdue = worstOverdue < 0;

  return (
    <div
      className={cn(
        'rounded-2xl border-2 bg-card transition-all duration-300 ease-out overflow-hidden',
        expanded
          ? 'shadow-xl border-primary/30'
          : 'opacity-60 scale-[0.97] cursor-pointer hover:opacity-80',
      )}
      style={expanded ? { borderColor: group.categoryColor } : undefined}
      onClick={expanded ? undefined : onActivate}
    >
      <div
        className={cn(
          'flex items-center gap-3 px-4',
          expanded ? 'py-3 border-b border-border' : 'py-3'
        )}
      >
        <span className="text-2xl leading-none">{group.categoryEmoji}</span>
        <h2
          className="flex-1 font-extrabold text-base truncate"
          style={{ color: group.categoryColor }}
        >
          {group.categoryName}
        </h2>
        <div
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-bold',
            isOverdue
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-amber-500/20 text-amber-700'
          )}
        >
          {group.items.length} món
        </div>
        {!expanded && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </div>

      {!expanded && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {group.items.map(rec => (
            <span
              key={rec.ingredient.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted/60 text-foreground/80 px-2 py-0.5 text-xs leading-tight max-w-full"
            >
              <span className="leading-none">{rec.ingredient.emoji ?? '•'}</span>
              <span className="truncate">{rec.ingredient.name}</span>
            </span>
          ))}
        </div>
      )}

      {expanded && (
        <div className="p-3 space-y-2 bg-background/50">
          {group.items.map(rec => (
            <RecommendationCard
              key={rec.ingredient.id}
              recommendation={rec}
              isInOrder={inOrderIds.has(rec.ingredient.id)}
              onCopy={() => onCopy(rec.ingredient)}
              onDismiss={() => onDismiss(rec.ingredient)}
              onDone={() => onDone(rec.ingredient)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
