export type UnitOfMeasurement = 'kg' | 'g' | 'liter' | 'ml' | 'piece' | 'pack' | 'bottle' | 'box' | 'bag' | 'can' | 'roll' | 'dozen' | 'tank' | 'pair';

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  unit: UnitOfMeasurement;
  category: string;
  subcategory?: string;
  referencePrice?: number;
  supplier?: string;
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
  category: string;
  subcategory?: string;
  referencePrice?: number;
  supplier?: string;
  emoji?: string;
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
  liter: 'lít',
  ml: 'ml',
  piece: 'cái',
  pack: 'gói',
  bottle: 'chai',
  box: 'hộp',
  bag: 'bịch',
  can: 'lon',
  roll: 'cuộn',
  dozen: 'tá',
  tank: 'bình',
  pair: 'đôi',
};

export const UNIT_FULL_LABELS: Record<UnitOfMeasurement, string> = {
  kg: 'kg',
  g: 'g',
  liter: 'lít',
  ml: 'ml',
  piece: 'cái',
  pack: 'gói',
  bottle: 'chai',
  box: 'hộp',
  bag: 'bịch',
  can: 'lon',
  roll: 'cuộn',
  dozen: 'tá',
  tank: 'bình',
  pair: 'đôi',
};
