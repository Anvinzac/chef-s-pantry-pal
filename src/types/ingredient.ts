export type UnitOfMeasurement = 'kg' | 'g' | 'liter' | 'ml' | 'piece' | 'pack' | 'bottle' | 'box' | 'bag' | 'can' | 'roll' | 'dozen' | 'tank' | 'pair';

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  unit: UnitOfMeasurement;
  category: string;
  subcategory?: string;
  referencePrice?: number;
  quickQuantities: number[];
  lastOrderedQuantity?: number;
  lastOrderDate?: string;
  orderFrequencyDays?: number;
  nextReminder?: string;
}

export interface OrderItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: UnitOfMeasurement;
  timestamp: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  emoji?: string;
}

export const UNIT_LABELS: Record<UnitOfMeasurement, string> = {
  kg: 'kg',
  g: 'g',
  liter: 'L',
  ml: 'ml',
  piece: 'pc',
  pack: 'pk',
  bottle: 'btl',
  box: 'box',
  bag: 'bag',
  can: 'can',
  roll: 'roll',
  dozen: 'dz',
  tank: 'tank',
  pair: 'pair',
};

export const UNIT_FULL_LABELS: Record<UnitOfMeasurement, string> = {
  kg: 'kilogram',
  g: 'gram',
  liter: 'liter',
  ml: 'milliliter',
  piece: 'piece',
  pack: 'package',
  bottle: 'bottle',
  box: 'box',
  bag: 'bag',
  can: 'can',
  roll: 'roll',
  dozen: 'dozen',
  tank: 'tank',
  pair: 'pair',
};
