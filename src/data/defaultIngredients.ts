import ingredientsData from './ingredients.json';
import { Category, Ingredient } from '@/types/ingredient';

export const categories: Category[] = [
  {
    id: 'vegetables',
    name: 'Rau Củ',
    emoji: '🥬',
    color: 'hsl(145, 65%, 42%)',
    subcategories: [
      { id: 'leafy-greens', name: 'Rau lá xanh', emoji: '🥬' },
      { id: 'herbs', name: 'Rau gia vị', emoji: '🌿' },
      { id: 'root-vegetables', name: 'Củ', emoji: '🥕' },
      { id: 'fruit-vegetables', name: 'Rau ăn quả', emoji: '🍅' },
      { id: 'beans-legumes', name: 'Đậu và hạt', emoji: '🫘' },
      { id: 'mushrooms', name: 'Nấm', emoji: '🍄' },
      { id: 'stems-shoots', name: 'Thân và chồi', emoji: '🌱' },
      { id: 'sea-vegetables', name: 'Rau biển', emoji: '🌊' },
    ],
  },
  { id: 'sauces', name: 'Nước Chấm', emoji: '🫙', color: 'hsl(0, 72%, 55%)' },
  { id: 'spices', name: 'Gia Vị', emoji: '🧂', color: 'hsl(32, 90%, 52%)' },
  { id: 'grains', name: 'Ngũ Cốc', emoji: '🌾', color: 'hsl(42, 75%, 50%)' },
  { id: 'oils', name: 'Dầu Mỡ', emoji: '🫒', color: 'hsl(62, 55%, 42%)' },
  { id: 'tofu', name: 'Đậu Hũ', emoji: '🧈', color: 'hsl(45, 70%, 55%)' },
  { id: 'takeaway', name: 'Mang Đi', emoji: '🥡', color: 'hsl(30, 80%, 55%)' },
  { id: 'gas', name: 'Gas', emoji: '⛽', color: 'hsl(210, 65%, 50%)' },
  { id: 'equipment', name: 'Dụng Cụ', emoji: '🔧', color: 'hsl(220, 20%, 50%)' },
  { id: 'tissue', name: 'Vệ Sinh', emoji: '🧻', color: 'hsl(188, 55%, 48%)' },
];

export const defaultIngredients: Ingredient[] = ingredientsData as Ingredient[];
