import { useState, useCallback, useEffect } from 'react';
import { Ingredient } from '@/types/ingredient';

export interface ReorderAlert {
  ingredientId: string;
  name: string;
  emoji: string;
  category: string;
  daysSinceLastOrder: number;
  cycleDays: number;
}

/**
 * Hook that checks each ingredient's lastOrderDate against orderFrequencyDays
 * to determine reorder alerts. Fully local, no Supabase.
 */
export function useReorderAlerts(ingredients: Ingredient[]) {
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);

  const checkAlerts = useCallback(async () => {
    const tracked = ingredients.filter(i => i.orderFrequencyDays && i.orderFrequencyDays > 0);
    if (tracked.length === 0) { setAlerts([]); return; }

    const now = Date.now();
    const newAlerts: ReorderAlert[] = [];

    for (const ing of tracked) {
      if (!ing.lastOrderDate) {
        newAlerts.push({
          ingredientId: ing.id,
          name: ing.name,
          emoji: ing.emoji,
          category: ing.category,
          daysSinceLastOrder: 999,
          cycleDays: ing.orderFrequencyDays!,
        });
        continue;
      }

      const daysSince = Math.floor((now - new Date(ing.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince >= ing.orderFrequencyDays!) {
        newAlerts.push({
          ingredientId: ing.id,
          name: ing.name,
          emoji: ing.emoji,
          category: ing.category,
          daysSinceLastOrder: daysSince,
          cycleDays: ing.orderFrequencyDays!,
        });
      }
    }

    setAlerts(newAlerts);
  }, [ingredients]);

  useEffect(() => {
    checkAlerts();
  }, [checkAlerts]);

  const getAlertCountForCategory = useCallback((categoryId: string): number => {
    return alerts.filter(a => a.category === categoryId).length;
  }, [alerts]);

  const isIngredientAlerted = useCallback((ingredientId: string): ReorderAlert | undefined => {
    return alerts.find(a => a.ingredientId === ingredientId);
  }, [alerts]);

  const refreshAlerts = useCallback(() => {
    checkAlerts();
  }, [checkAlerts]);

  return {
    alerts,
    getAlertCountForCategory,
    isIngredientAlerted,
    refreshAlerts,
  };
}
