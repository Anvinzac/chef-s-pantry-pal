export type UnitOfMeasurement = 'kg' | 'g' | 'lít' | 'ml' | 'cái' | 'gói' | 'chai' | 'hộp' | 'bịch' | 'lon' | 'cuộn' | 'tá' | 'bình' | 'đôi';

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  unit: UnitOfMeasurement;
  category: string;
  subcategory?: string;
  rarity?: 'common' | 'uncommon' | 'rarely';
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
  lít: 'lít',
  ml: 'ml',
  cái: 'cái',
  gói: 'gói',
  chai: 'chai',
  hộp: 'hộp',
  bịch: 'bịch',
  lon: 'lon',
  cuộn: 'cuộn',
  tá: 'tá',
  bình: 'bình',
  đôi: 'đôi',
};

export const UNIT_FULL_LABELS: Record<UnitOfMeasurement, string> = {
  kg: 'kg',
  g: 'g',
  lít: 'lít',
  ml: 'ml',
  cái: 'cái',
  gói: 'gói',
  chai: 'chai',
  hộp: 'hộp',
  bịch: 'bịch',
  lon: 'lon',
  cuộn: 'cuộn',
  tá: 'tá',
  bình: 'bình',
  đôi: 'đôi',
};
