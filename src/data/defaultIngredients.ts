import ingredientsData from './ingredients.json';
import { Category, Ingredient } from '@/types/ingredient';

export const categories: Category[] = [
  {
    id: 'vegetables',
    name: 'Rau Củ',
    emoji: '🥬',
    color: 'hsl(145, 65%, 42%)',
    subcategories: [
      { id: 'root', name: 'Củ', emoji: '🥕' },
      { id: 'leaf1', name: 'Lá 1', emoji: '🥬' },
      { id: 'leaf2', name: 'Lá 2', emoji: '🌿' },
      { id: 'others', name: 'Khác', emoji: '🍄' },
    ],
  },
  { id: 'sauces', name: 'Nước Chấm', emoji: '🫙', color: 'hsl(0, 72%, 55%)' },
  { id: 'spices', name: 'Gia Vị', emoji: '🧂', color: 'hsl(32, 90%, 52%)' },
  { id: 'grains', name: 'Ngũ Cốc', emoji: '🌾', color: 'hsl(42, 75%, 50%)' },
  { id: 'oils', name: 'Dầu Mỡ', emoji: '🫒', color: 'hsl(62, 55%, 42%)' },
  { id: 'dairy', name: 'Sữa', emoji: '🧀', color: 'hsl(48, 85%, 60%)' },
  { id: 'gas', name: 'Gas', emoji: '⛽', color: 'hsl(210, 65%, 50%)' },
  { id: 'equipment', name: 'Dụng Cụ', emoji: '🔧', color: 'hsl(220, 20%, 50%)' },
  { id: 'tissue', name: 'Vệ Sinh', emoji: '🧻', color: 'hsl(188, 55%, 48%)' },
];

export const defaultIngredients: Ingredient[] = ingredientsData as Ingredient[];
