import { useState, useCallback, useEffect } from 'react';
import { MenuDish, MenuCategory, SINGLE_CHOICE_CATEGORIES, MenuCategoryConfig } from '@/data/menuDishes';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export interface SelectedDish {
  id: string;
  name: string;
  category: MenuCategory;
  order: number;
}

const MAX_DISHES = 16;
const FIXED_FIRST_DISH: SelectedDish = {
  id: 'fixed-cari',
  name: 'Cà ri',
  category: 'stew',
  order: 1,
};

export function useMenuPlanner(menuCategories: MenuCategoryConfig[], branchId: string = 'pnt', _restaurantId: string | null = null) {
  const [selectedDishes, setSelectedDishes] = useState<SelectedDish[]>([FIXED_FIRST_DISH]);
  const [yesterdayDishes, setYesterdayDishes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    api.getDailyMenu(dateStr, branchId).then(data => {
      if (data?.dishes) setYesterdayDishes(data.dishes.map((d: any) => d.id));
      else setYesterdayDishes([]);
    }).catch(() => setYesterdayDishes([]));
  }, [branchId]);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    api.getDailyMenu(dateStr, branchId).then(data => {
      if (data?.dishes && data.dishes.length > 0) {
        setSelectedDishes([
          FIXED_FIRST_DISH,
          ...data.dishes
            .filter((d: any) => d.id !== 'fixed-cari')
            .map((d: any, i: number) => ({ ...d, order: i + 2 })),
        ]);
      } else {
        setSelectedDishes([FIXED_FIRST_DISH]);
      }
    }).catch(() => setSelectedDishes([FIXED_FIRST_DISH]));
  }, [branchId]);

  const toggleDish = useCallback((dish: MenuDish) => {
    setSelectedDishes(prev => {
      const isSelected = prev.some(d => d.id === dish.id);
      if (isSelected) {
        if (dish.id === 'fixed-cari') return prev;
        const filtered = prev.filter(d => d.id !== dish.id);
        return filtered.map((d, i) => ({ ...d, order: i + 1 }));
      }
      if (prev.length >= MAX_DISHES) { toast.error('Tối đa 16 món!'); return prev; }

      const isSingleChoice = SINGLE_CHOICE_CATEGORIES.includes(dish.category);
      if (isSingleChoice) {
        const withoutSameCategory = prev.filter(d => d.category !== dish.category || d.id === 'fixed-cari');
        const newDish: SelectedDish = { id: dish.id, name: dish.name, category: dish.category, order: 0 };
        const oldIdx = prev.findIndex(d => d.category === dish.category && d.id !== 'fixed-cari');
        let result: SelectedDish[];
        if (oldIdx >= 0) { result = [...prev]; result[oldIdx] = newDish; }
        else { result = [...withoutSameCategory, newDish]; }
        return result.map((d, i) => ({ ...d, order: i + 1 }));
      }

      return [...prev, { id: dish.id, name: dish.name, category: dish.category, order: prev.length + 1 }];
    });
  }, []);

  const removeDish = useCallback((dishId: string) => {
    if (dishId === 'fixed-cari') return;
    setSelectedDishes(prev => prev.filter(d => d.id !== dishId).map((d, i) => ({ ...d, order: i + 1 })));
  }, []);

  const isDishSelected = useCallback((dishId: string) => selectedDishes.some(d => d.id === dishId), [selectedDishes]);
  const isYesterdayDish = useCallback((dishId: string) => yesterdayDishes.includes(dishId), [yesterdayDishes]);

  const getMenuText = useCallback(() => {
    const lines = ['Dạ, hôm nay Lá có:'];
    selectedDishes.forEach(d => lines.push(`${d.order}. ${d.name}`));
    return lines.join('\n');
  }, [selectedDishes]);

  const validateMenu = useCallback(() => {
    const warnings: string[] = [];
    if (selectedDishes.length < 15) warnings.push(`Chỉ có ${selectedDishes.length}/15 món`);
    const presentCategories = new Set(selectedDishes.map(d => d.category));
    const missing = menuCategories.filter(c => !presentCategories.has(c.id)).map(c => c.vnName);
    if (missing.length > 0) warnings.push(`Thiếu: ${missing.join(', ')}`);
    const repeats: string[] = [];
    for (const catId of SINGLE_CHOICE_CATEGORIES) {
      const selected = selectedDishes.find(d => d.category === catId);
      if (selected && yesterdayDishes.includes(selected.id)) {
        repeats.push(`${menuCategories.find(c => c.id === catId)?.vnName ?? catId}: ${selected.name}`);
      }
    }
    if (repeats.length > 0) warnings.push(`Trùng hôm qua: ${repeats.join(', ')}`);
    return warnings;
  }, [selectedDishes, yesterdayDishes, menuCategories]);

  const saveMenu = useCallback(async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const dishesData = selectedDishes.map(d => ({ id: d.id, name: d.name, category: d.category, order: d.order }));
    try {
      await api.saveDailyMenu(dateStr, branchId, dishesData);
      toast.success('Đã lưu menu!');
    } catch {
      toast.error('Lỗi lưu menu');
    }
  }, [selectedDishes, branchId]);

  return { selectedDishes, toggleDish, removeDish, isDishSelected, isYesterdayDish, getMenuText, validateMenu, saveMenu, maxDishes: MAX_DISHES };
}
