import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MenuDish, MenuCategory, SINGLE_CHOICE_CATEGORIES, MenuCategoryConfig } from '@/data/menuDishes';
import { toast } from 'sonner';

export interface SelectedDish {
  id: string;
  name: string;
  category: MenuCategory;
  order: number; // display order (1-based, 1 is always Cà ri)
}

const MAX_DISHES = 16;
const FIXED_FIRST_DISH: SelectedDish = {
  id: 'fixed-cari',
  name: 'Cà ri',
  category: 'stew', // closest category
  order: 1,
};

export function useMenuPlanner(menuCategories: MenuCategoryConfig[]) {
  const [selectedDishes, setSelectedDishes] = useState<SelectedDish[]>([FIXED_FIRST_DISH]);
  const [yesterdayDishes, setYesterdayDishes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch yesterday's menu for repetition check
  useEffect(() => {
    const fetchYesterday = async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      const { data } = await supabase
        .from('daily_menus')
        .select('dishes')
        .eq('menu_date', dateStr)
        .single();

      if (data?.dishes) {
        const dishes = data.dishes as any[];
        setYesterdayDishes(dishes.map((d: any) => d.id));
      }
    };
    fetchYesterday();
  }, []);

  // Fetch today's menu if it exists
  useEffect(() => {
    const fetchToday = async () => {
      const today = new Date();
      // We plan for tomorrow
      today.setDate(today.getDate() + 1);
      const dateStr = today.toISOString().split('T')[0];

      const { data } = await supabase
        .from('daily_menus')
        .select('dishes')
        .eq('menu_date', dateStr)
        .single();

      if (data?.dishes) {
        const dishes = data.dishes as any[];
        if (dishes.length > 0) {
          setSelectedDishes([
            FIXED_FIRST_DISH,
            ...dishes
              .filter((d: any) => d.id !== 'fixed-cari')
              .map((d: any, i: number) => ({ ...d, order: i + 2 })),
          ]);
        }
      }
    };
    fetchToday();
  }, []);

  const toggleDish = useCallback((dish: MenuDish) => {
    setSelectedDishes(prev => {
      const isSelected = prev.some(d => d.id === dish.id);

      if (isSelected) {
        // Remove (but never remove fixed first dish)
        if (dish.id === 'fixed-cari') return prev;
        const filtered = prev.filter(d => d.id !== dish.id);
        // Renumber
        return filtered.map((d, i) => ({ ...d, order: i + 1 }));
      }

      // Adding
      if (prev.length >= MAX_DISHES) {
        toast.error('Tối đa 16 món!');
        return prev;
      }

      const isSingleChoice = SINGLE_CHOICE_CATEGORIES.includes(dish.category);

      if (isSingleChoice) {
        // Replace existing dish from same category
        const withoutSameCategory = prev.filter(d => d.category !== dish.category || d.id === 'fixed-cari');
        const newDish: SelectedDish = {
          id: dish.id,
          name: dish.name,
          category: dish.category,
          order: 0, // will be renumbered
        };

        // Find where the old one was and insert there, or append
        const oldIdx = prev.findIndex(d => d.category === dish.category && d.id !== 'fixed-cari');
        let result: SelectedDish[];
        if (oldIdx >= 0) {
          result = [...prev];
          result[oldIdx] = newDish;
        } else {
          result = [...withoutSameCategory, newDish];
        }
        return result.map((d, i) => ({ ...d, order: i + 1 }));
      }

      // Multi-choice: just append
      const newDish: SelectedDish = {
        id: dish.id,
        name: dish.name,
        category: dish.category,
        order: prev.length + 1,
      };
      return [...prev, newDish];
    });
  }, []);

  const removeDish = useCallback((dishId: string) => {
    if (dishId === 'fixed-cari') return;
    setSelectedDishes(prev => {
      const filtered = prev.filter(d => d.id !== dishId);
      return filtered.map((d, i) => ({ ...d, order: i + 1 }));
    });
  }, []);

  const isDishSelected = useCallback((dishId: string) => {
    return selectedDishes.some(d => d.id === dishId);
  }, [selectedDishes]);

  const isYesterdayDish = useCallback((dishId: string) => {
    return yesterdayDishes.includes(dishId);
  }, [yesterdayDishes]);

  const getMenuText = useCallback(() => {
    const lines = ['Dạ, hôm nay Lá có:'];
    selectedDishes.forEach(d => {
      lines.push(`${d.order}. ${d.name}`);
    });
    return lines.join('\n');
  }, [selectedDishes]);

  const validateMenu = useCallback(() => {
    const warnings: string[] = [];
    const dishCount = selectedDishes.length;

    if (dishCount < 15) {
      warnings.push(`Chỉ có ${dishCount}/15 món`);
    }

    // Check all 9 categories represented
    const presentCategories = new Set(selectedDishes.map(d => d.category));
    const missingCategories = menuCategories
      .filter(c => !presentCategories.has(c.id))
      .map(c => c.vnName);

    if (missingCategories.length > 0) {
      warnings.push(`Thiếu: ${missingCategories.join(', ')}`);
    }

    // Check single-choice categories for repeats from yesterday
    const repeats: string[] = [];
    for (const catId of SINGLE_CHOICE_CATEGORIES) {
      const selected = selectedDishes.find(d => d.category === catId);
      if (selected && yesterdayDishes.includes(selected.id)) {
        const catName = menuCategories.find(c => c.id === catId)?.vnName ?? catId;
        repeats.push(`${catName}: ${selected.name}`);
      }
    }
    if (repeats.length > 0) {
      warnings.push(`Trùng hôm qua: ${repeats.join(', ')}`);
    }

    return warnings;
  }, [selectedDishes, yesterdayDishes]);

  const saveMenu = useCallback(async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const dishesData = selectedDishes.map(d => ({
      id: d.id,
      name: d.name,
      category: d.category,
      order: d.order,
    }));

    // Upsert
    const { error } = await supabase
      .from('daily_menus')
      .upsert(
        { menu_date: dateStr, dishes: dishesData as any },
        { onConflict: 'menu_date' }
      );

    if (error) {
      toast.error('Lỗi lưu menu');
      console.error(error);
    } else {
      toast.success('Đã lưu menu!');
    }
  }, [selectedDishes]);

  return {
    selectedDishes,
    toggleDish,
    removeDish,
    isDishSelected,
    isYesterdayDish,
    getMenuText,
    validateMenu,
    saveMenu,
    maxDishes: MAX_DISHES,
  };
}
