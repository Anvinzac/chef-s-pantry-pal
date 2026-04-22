import { Ingredient } from '@/types/ingredient';
import { categories } from '@/data/defaultIngredients';
import { toIsoDate } from '@/lib/purchaseCycle';

interface SeedSpec {
  daysAgo: number;
  cycle: number;
  quantity: number;
}

const SEED_PATTERNS: SeedSpec[] = [
  { daysAgo: 8, cycle: 7, quantity: 5 },
  { daysAgo: 7, cycle: 7, quantity: 3 },
  { daysAgo: 14, cycle: 14, quantity: 2 },
  { daysAgo: 15, cycle: 14, quantity: 4 },
  { daysAgo: 30, cycle: 30, quantity: 1 },
];

export function seedDemoIngredients(ingredients: Ingredient[]): Ingredient[] {
  const byCategory = new Map<string, Ingredient[]>();
  for (const ing of ingredients) {
    const list = byCategory.get(ing.category) ?? [];
    list.push(ing);
    byCategory.set(ing.category, list);
  }

  const patched = new Map(ingredients.map(i => [i.id, i]));
  const today = new Date();

  for (const cat of categories) {
    const list = byCategory.get(cat.id) ?? [];
    const picks = list.slice(0, 2);
    picks.forEach((ing, idx) => {
      const spec = SEED_PATTERNS[(idx + cat.id.length) % SEED_PATTERNS.length];
      const date = new Date(today);
      date.setDate(date.getDate() - spec.daysAgo);
      patched.set(ing.id, {
        ...ing,
        lastOrderDate: `${toIsoDate(date)}T08:00:00.000Z`,
        lastOrderedQuantity: spec.quantity,
        orderFrequencyDays: spec.cycle,
      });
    });
  }

  return ingredients.map(i => patched.get(i.id) ?? i);
}
