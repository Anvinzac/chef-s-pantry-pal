import { useMemo } from 'react';
import { categories } from '@/data/defaultIngredients';
import { Ingredient } from '@/types/ingredient';
import { Recommendation, RecommendationGroup } from '@/types/recommendation';
import { computeRemainingCycle, parseIsoDate } from '@/lib/purchaseCycle';
import { useOrder } from '@/hooks/useOrder';
import { useDayWeights } from '@/hooks/useDayWeights';
import { useCategorySettings } from '@/hooks/useCategorySettings';
import { useDismissals } from '@/hooks/useDismissals';

const REMINDER_THRESHOLD = 1;

function isEligible(ingredient: Ingredient): ingredient is Ingredient & {
  lastOrderDate: string;
  orderFrequencyDays: number;
} {
  return Boolean(ingredient.lastOrderDate && typeof ingredient.orderFrequencyDays === 'number' && ingredient.orderFrequencyDays > 0);
}

export function useRecommendations() {
  const { ingredients } = useOrder();
  const { overrides } = useDayWeights();
  const { getDeliveryOffset } = useCategorySettings();
  const { isDismissedToday } = useDismissals();

  return useMemo<RecommendationGroup[]>(() => {
    const today = new Date();
    const byCategory = new Map<string, Recommendation[]>();

    for (const ing of ingredients) {
      if (!isEligible(ing)) continue;
      if (isDismissedToday(ing.id)) continue;

      const lastPurchaseDate = parseIsoDate(ing.lastOrderDate.split('T')[0]);
      const remainingCycle = computeRemainingCycle({
        lastPurchaseDate,
        orderFrequencyDays: ing.orderFrequencyDays,
        categoryId: ing.category,
        deliveryOffset: getDeliveryOffset(ing.category),
        overrides,
        today,
      });

      if (remainingCycle >= REMINDER_THRESHOLD) continue;

      const rec: Recommendation = {
        ingredient: ing,
        lastPurchaseDate: ing.lastOrderDate,
        orderFrequencyDays: ing.orderFrequencyDays,
        remainingCycle,
        referencePrice: ing.referencePrice,
      };
      const list = byCategory.get(ing.category) ?? [];
      list.push(rec);
      byCategory.set(ing.category, list);
    }

    return categories
      .map<RecommendationGroup>(cat => ({
        categoryId: cat.id,
        categoryName: cat.name,
        categoryEmoji: cat.emoji,
        categoryColor: cat.color,
        items: (byCategory.get(cat.id) ?? []).sort((a, b) => a.remainingCycle - b.remainingCycle),
      }))
      .filter(group => group.items.length > 0);
  }, [ingredients, overrides, getDeliveryOffset, isDismissedToday]);
}
