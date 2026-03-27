import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Ingredient } from '@/types/ingredient';

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

export function useStockReports(restaurantId: string | null) {
  const [reports, setReports] = useState<StockReport[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('stock_reports')
      .select('*')
      .is('resolved_at', null)
      .eq('restaurant_id', restaurantId)
      .order('reported_at', { ascending: false });

    if (!error && data) setReports(data as StockReport[]);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const reportOutOfStock = useCallback(async (ingredient: Ingredient) => {
    if (!restaurantId) return;
    const existing = reports.find(r => r.ingredient_id === ingredient.id);
    if (existing) return;

    const { error } = await supabase.from('stock_reports').insert({
      ingredient_id: ingredient.id,
      name: ingredient.name,
      emoji: ingredient.emoji,
      category: ingredient.category,
      subcategory: ingredient.subcategory ?? null,
      unit: ingredient.unit,
      restaurant_id: restaurantId,
    } as any);

    if (!error) fetchReports();
  }, [reports, fetchReports, restaurantId]);

  const resolveReport = useCallback(async (ingredientId: string) => {
    const report = reports.find(r => r.ingredient_id === ingredientId);
    if (!report) return;

    const { error } = await supabase
      .from('stock_reports')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', report.id);

    if (!error) fetchReports();
  }, [reports, fetchReports]);

  const isOutOfStock = useCallback((ingredientId: string) => {
    return reports.some(r => r.ingredient_id === ingredientId);
  }, [reports]);

  const outOfStockCount = reports.length;

  return {
    reports,
    loading,
    outOfStockCount,
    reportOutOfStock,
    resolveReport,
    isOutOfStock,
    fetchReports,
  };
}
