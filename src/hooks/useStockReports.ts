import { useState, useCallback, useEffect } from 'react';
import { Ingredient } from '@/types/ingredient';
import { api } from '@/lib/api';

export interface StockReport {
  id: string;
  ingredient_id: string;
  name: string;
  emoji: string;
  category: string;
  subcategory: string | null;
  unit: string;
  reported_at: string;
  resolved_at: string | null;
}

export function useStockReports(_restaurantId: string | null) {
  const [reports, setReports] = useState<StockReport[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getStockReports();
      setReports(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const reportOutOfStock = useCallback(async (ingredient: Ingredient) => {
    const existing = reports.find(r => r.ingredient_id === ingredient.id);
    if (existing) return;

    try {
      await api.reportOutOfStock({
        ingredientId: ingredient.id,
        name: ingredient.name,
        emoji: ingredient.emoji,
        category: ingredient.category,
        subcategory: ingredient.subcategory ?? null,
        unit: ingredient.unit,
      });
      fetchReports();
    } catch {}
  }, [reports, fetchReports]);

  const resolveReport = useCallback(async (ingredientId: string) => {
    const report = reports.find(r => r.ingredient_id === ingredientId);
    if (!report) return;

    try {
      await api.resolveStockReport(report.id);
      fetchReports();
    } catch {}
  }, [reports, fetchReports]);

  const isOutOfStock = useCallback((ingredientId: string) => {
    return reports.some(r => r.ingredient_id === ingredientId);
  }, [reports]);

  const outOfStockCount = reports.length;

  return { reports, loading, outOfStockCount, reportOutOfStock, resolveReport, isOutOfStock, fetchReports };
}
