import { useState, useCallback } from 'react';
import { OrderItem } from '@/types/ingredient';
import { estimateCostK } from '@/data/referencePrices';
import { toast } from 'sonner';
import { api } from '@/lib/api';

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

export function useOrderHistory(_restaurantId: string | null) {
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

    const items = currentOrder.map(item => {
      const ing = ingredients.find(ig => ig.id === item.ingredientId);
      return {
        ingredientId: item.ingredientId,
        name: item.name,
        category: ing?.category ?? 'unknown',
        quantity: item.quantity,
        unit: item.unit,
        costK: estimateCostK(item.ingredientId, item.quantity) ?? null,
        referencePrice: item.referencePrice ?? null,
        supplier: item.supplier ?? null,
        emoji: item.emoji ?? null,
        subcategory: item.subcategory ?? null,
      };
    });

    try {
      const result = await api.saveOrder(Math.round(totalCostK * 10) / 10, items);
      toast.success('Đã lưu đơn hàng!');
      return result.id;
    } catch {
      toast.error('Lỗi lưu đơn hàng');
    }
  }, []);

  const fetchOrders = useCallback(async (timeRange: TimeRange = 'all', categoryFilter?: string) => {
    setLoading(true);
    try {
      const since = getDateOffset(timeRange) ?? undefined;
      const data = await api.getOrders(since, categoryFilter);
      setOrders(data);
    } catch {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  return { orders, loading, saveOrder, fetchOrders };
}
