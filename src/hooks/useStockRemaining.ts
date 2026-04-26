import { useState, useCallback, useEffect } from 'react';
import { Ingredient } from '@/types/ingredient';
import { api } from '@/lib/api';

export interface StockRemainingReport {
  id: string;
  ingredient_id: string;
  remaining_quantity: number;
  unit: string;
  reported_at: string;
}

export function useStockRemaining(_restaurantId: string | null) {
  const [reports, setReports] = useState<StockRemainingReport[]>([]);

  const fetchReports = useCallback(async () => {
    try {
      const data = await api.getStockRemaining();
      setReports(data);
    } catch {}
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const reportRemaining = useCallback(async (ingredient: Ingredient, quantity: number) => {
    try {
      await api.reportRemaining({
        ingredientId: ingredient.id,
        name: ingredient.name,
        emoji: ingredient.emoji,
        category: ingredient.category,
        subcategory: ingredient.subcategory ?? null,
        unit: ingredient.unit,
        quantity,
      });
      fetchReports();
    } catch {}
  }, [fetchReports]);

  const getRemainingQuantity = useCallback((ingredientId: string): number | null => {
    const report = reports.find(r => r.ingredient_id === ingredientId);
    return report ? report.remaining_quantity : null;
  }, [reports]);

  return { reports, reportRemaining, getRemainingQuantity, fetchReports };
}
