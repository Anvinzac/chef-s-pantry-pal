import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Ingredient } from '@/types/ingredient';
import { categories } from '@/data/defaultIngredients';

export interface ReorderAlert {
  ingredientId: string;
  name: string;
  emoji: string;
  category: string;
  daysSinceLastOrder: number;
  cycleDays: number;
}

/**
 * Hook that checks order_items for each ingredient's last order date
 * and compares it with orderFrequencyDays to determine reorder alerts.
 */
export function useReorderAlerts(ingredients: Ingredient[]) {
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);
  const [dismissedCategories, setDismissedCategories] = useState<Set<string>>(new Set());
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);

  const checkAlerts = useCallback(async () => {
    // Only check ingredients with orderFrequencyDays
    const tracked = ingredients.filter(i => i.orderFrequencyDays && i.orderFrequencyDays > 0);
    if (tracked.length === 0) { setAlerts([]); return; }

    const ingredientIds = tracked.map(i => i.id);

    // Get latest order date per ingredient
    const { data, error } = await supabase
      .from('order_items')
      .select('ingredient_id, created_at')
      .in('ingredient_id', ingredientIds)
      .order('created_at', { ascending: false });

    if (error) { console.error(error); return; }

    // Group by ingredient, keep latest
    const latestMap = new Map<string, string>();
    for (const row of (data ?? [])) {
      if (!latestMap.has(row.ingredient_id)) {
        latestMap.set(row.ingredient_id, row.created_at);
      }
    }

    const now = Date.now();
    const newAlerts: ReorderAlert[] = [];

    for (const ing of tracked) {
      const lastOrderStr = latestMap.get(ing.id);
      if (!lastOrderStr) {
        // Never ordered — alert
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

      const daysSince = Math.floor((now - new Date(lastOrderStr).getTime()) / (1000 * 60 * 60 * 24));
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

  /** Count alerts per category (excluding dismissed) */
  const getAlertCountForCategory = useCallback((categoryId: string): number => {
    if (dismissedCategories.has(categoryId)) return 0;
    return alerts.filter(a => a.category === categoryId).length;
  }, [alerts, dismissedCategories]);

  /** Dismiss badge for a category & set it as highlighted */
  const dismissCategory = useCallback((categoryId: string) => {
    setDismissedCategories(prev => new Set(prev).add(categoryId));
    setHighlightedCategory(categoryId);
  }, []);

  /** Check if an ingredient is in reorder alert */
  const isIngredientAlerted = useCallback((ingredientId: string): ReorderAlert | undefined => {
    if (!highlightedCategory) return undefined;
    return alerts.find(a => a.ingredientId === ingredientId && a.category === highlightedCategory);
  }, [alerts, highlightedCategory]);

  /** Clear highlight mode */
  const clearHighlight = useCallback(() => {
    setHighlightedCategory(null);
  }, []);

  return {
    alerts,
    getAlertCountForCategory,
    dismissCategory,
    isIngredientAlerted,
    highlightedCategory,
    clearHighlight,
  };
}
