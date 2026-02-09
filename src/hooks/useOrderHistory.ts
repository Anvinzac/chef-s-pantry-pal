import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OrderItem } from '@/types/ingredient';
import { estimateCostK } from '@/data/referencePrices';
import { toast } from 'sonner';

export interface SavedOrder {
  id: string;
  order_date: string;
  total_cost_k: number | null;
  notes: string | null;
  created_at: string;
  items: SavedOrderItem[];
}

export interface SavedOrderItem {
  id: string;
  ingredient_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  cost_k: number | null;
}

export type TimeRange = 'week' | '2weeks' | 'month' | 'quarter' | 'year' | 'all';

function getDateOffset(range: TimeRange): string | null {
  const now = new Date();
  switch (range) {
    case 'week': now.setDate(now.getDate() - 7); break;
    case '2weeks': now.setDate(now.getDate() - 14); break;
    case 'month': now.setMonth(now.getMonth() - 1); break;
    case 'quarter': now.setMonth(now.getMonth() - 3); break;
    case 'year': now.setFullYear(now.getFullYear() - 1); break;
    case 'all': return null;
  }
  return now.toISOString().split('T')[0];
}

export function useOrderHistory() {
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const saveOrder = useCallback(async (
    currentOrder: OrderItem[],
    ingredients: { id: string; category: string }[]
  ) => {
    if (currentOrder.length === 0) return;

    const totalCostK = currentOrder.reduce((sum, item) => {
      const cost = estimateCostK(item.ingredientId, item.quantity);
      return sum + (cost ?? 0);
    }, 0);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ total_cost_k: Math.round(totalCostK * 10) / 10 })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Failed to save order:', orderError);
      toast.error('Failed to save order');
      return;
    }

    const items = currentOrder.map(item => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      return {
        order_id: order.id,
        ingredient_id: item.ingredientId,
        name: item.name,
        category: ing?.category ?? 'unknown',
        quantity: item.quantity,
        unit: item.unit,
        cost_k: estimateCostK(item.ingredientId, item.quantity) ?? null,
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(items);

    if (itemsError) {
      console.error('Failed to save order items:', itemsError);
      toast.error('Failed to save order items');
      return;
    }

    toast.success('Order saved to history!');
    return order.id;
  }, []);

  const fetchOrders = useCallback(async (timeRange: TimeRange = 'all', categoryFilter?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false })
        .order('created_at', { ascending: false });

      const minDate = getDateOffset(timeRange);
      if (minDate) {
        query = query.gte('order_date', minDate);
      }

      const { data: ordersData, error } = await query;
      if (error) { console.error(error); setLoading(false); return; }

      // Fetch items for all orders
      const orderIds = (ordersData ?? []).map(o => o.id);
      if (orderIds.length === 0) { setOrders([]); setLoading(false); return; }

      let itemsQuery = supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (categoryFilter && categoryFilter !== 'all') {
        itemsQuery = itemsQuery.eq('category', categoryFilter);
      }

      const { data: itemsData, error: itemsError } = await itemsQuery;
      if (itemsError) { console.error(itemsError); setLoading(false); return; }

      const grouped: SavedOrder[] = (ordersData ?? []).map(o => ({
        ...o,
        items: (itemsData ?? []).filter(i => i.order_id === o.id),
      })).filter(o => o.items.length > 0); // hide orders with no matching items

      setOrders(grouped);
    } finally {
      setLoading(false);
    }
  }, []);

  return { orders, loading, saveOrder, fetchOrders };
}
