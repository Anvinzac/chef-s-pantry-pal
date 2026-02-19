import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Ingredient } from '@/types/ingredient';

export interface StockRemainingReport {
  id: string;
  ingredient_id: string;
  remaining_quantity: number;
  unit: string;
  reported_at: string;
}

export function useStockRemaining() {
  const [reports, setReports] = useState<StockRemainingReport[]>([]);

  const fetchReports = useCallback(async () => {
    // Get today's reports only
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await (supabase as any)
      .from('stock_remaining')
      .select('id, ingredient_id, remaining_quantity, unit, reported_at')
      .gte('reported_at', today)
      .order('reported_at', { ascending: false });

    if (!error && data) setReports(data);
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const reportRemaining = useCallback(async (ingredient: Ingredient, quantity: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await (supabase as any).from('stock_remaining').insert({
      ingredient_id: ingredient.id,
      name: ingredient.name,
      emoji: ingredient.emoji,
      category: ingredient.category,
      subcategory: ingredient.subcategory ?? null,
      unit: ingredient.unit,
      remaining_quantity: quantity,
      reported_by: user.id,
    });

    if (!error) fetchReports();
  }, [fetchReports]);

  const getRemainingQuantity = useCallback((ingredientId: string): number | null => {
    const report = reports.find(r => r.ingredient_id === ingredientId);
    return report ? report.remaining_quantity : null;
  }, [reports]);

  return {
    reports,
    reportRemaining,
    getRemainingQuantity,
    fetchReports,
  };
}
