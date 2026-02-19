import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MenuCategory, MenuCategoryConfig, MenuDish, SINGLE_CHOICE_CATEGORIES } from '@/data/menuDishes';

const CATEGORY_META: { id: MenuCategory; name: string; vnName: string }[] = [
  { id: 'boiled', name: 'Boiled', vnName: 'Luộc' },
  { id: 'stew', name: 'Stew', vnName: 'Kho' },
  { id: 'fried', name: 'Fried', vnName: 'Chiên' },
  { id: 'soup', name: 'Soup', vnName: 'Canh' },
  { id: 'hotpot', name: 'Hot Pot', vnName: 'Nước' },
  { id: 'sweet_soup', name: 'Sweet Soup', vnName: 'Chè' },
  { id: 'mixed_noodle', name: 'Mixed Noodle', vnName: 'Trộn' },
  { id: 'mixed_veg', name: 'Mixed Vegetables', vnName: 'Gỏi' },
  { id: 'stir_fry', name: 'Stir-fry', vnName: 'Xào' },
];

export function useMenuDishes() {
  const [categories, setCategories] = useState<MenuCategoryConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDishes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('menu_dishes')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching menu dishes:', error);
      setLoading(false);
      return;
    }

    const dishesByCategory = new Map<string, MenuDish[]>();
    for (const row of data ?? []) {
      const cat = row.category as MenuCategory;
      if (!dishesByCategory.has(cat)) dishesByCategory.set(cat, []);
      dishesByCategory.get(cat)!.push({
        id: row.id,
        name: row.name,
        category: cat,
      });
    }

    const cats: MenuCategoryConfig[] = CATEGORY_META.map(meta => ({
      id: meta.id,
      name: meta.name,
      vnName: meta.vnName,
      singleChoice: SINGLE_CHOICE_CATEGORIES.includes(meta.id),
      dishes: dishesByCategory.get(meta.id) ?? [],
    }));

    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => {
    fetchDishes();
  }, []);

  return { categories, loading, refetch: fetchDishes };
}
