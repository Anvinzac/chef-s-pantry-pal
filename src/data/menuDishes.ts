export interface MenuDish {
  id: string;
  name: string;
  category: MenuCategory;
}

export interface MenuCategoryConfig {
  id: MenuCategory;
  name: string;
  vnName: string;
  singleChoice: boolean;
  dishes: MenuDish[];
}

export type MenuCategory =
  | 'boiled'
  | 'stew'
  | 'fried'
  | 'soup'
  | 'hotpot'
  | 'sweet_soup'
  | 'mixed_noodle'
  | 'mixed_veg'
  | 'stir_fry';

export const SINGLE_CHOICE_CATEGORIES: MenuCategory[] = ['soup', 'fried', 'hotpot', 'sweet_soup'];

export const menuCategories: MenuCategoryConfig[] = [
  {
    id: 'boiled',
    name: 'Boiled',
    vnName: 'Luộc',
    singleChoice: false,
    dishes: [
      { id: 'boiled-1', name: 'Gà luộc', category: 'boiled' },
      { id: 'boiled-2', name: 'Bắp bò luộc', category: 'boiled' },
      { id: 'boiled-3', name: 'Tôm luộc', category: 'boiled' },
      { id: 'boiled-4', name: 'Trứng luộc', category: 'boiled' },
      { id: 'boiled-5', name: 'Rau luộc', category: 'boiled' },
      { id: 'boiled-6', name: 'Heo luộc', category: 'boiled' },
    ],
  },
  {
    id: 'stew',
    name: 'Stew',
    vnName: 'Kho',
    singleChoice: false,
    dishes: [
      { id: 'stew-1', name: 'Thịt kho trứng', category: 'stew' },
      { id: 'stew-2', name: 'Cá kho tộ', category: 'stew' },
      { id: 'stew-3', name: 'Sườn kho', category: 'stew' },
      { id: 'stew-4', name: 'Đậu hũ kho', category: 'stew' },
      { id: 'stew-5', name: 'Thịt kho tiêu', category: 'stew' },
      { id: 'stew-6', name: 'Gà kho gừng', category: 'stew' },
    ],
  },
  {
    id: 'fried',
    name: 'Fried',
    vnName: 'Chiên',
    singleChoice: true,
    dishes: [
      { id: 'fried-1', name: 'Cá chiên', category: 'fried' },
      { id: 'fried-2', name: 'Đậu hũ chiên', category: 'fried' },
      { id: 'fried-3', name: 'Gà chiên', category: 'fried' },
      { id: 'fried-4', name: 'Chả giò', category: 'fried' },
      { id: 'fried-5', name: 'Tôm chiên', category: 'fried' },
      { id: 'fried-6', name: 'Nem rán', category: 'fried' },
    ],
  },
  {
    id: 'soup',
    name: 'Soup',
    vnName: 'Canh',
    singleChoice: true,
    dishes: [
      { id: 'soup-1', name: 'Canh chua', category: 'soup' },
      { id: 'soup-2', name: 'Canh bí đao', category: 'soup' },
      { id: 'soup-3', name: 'Canh rau muống', category: 'soup' },
      { id: 'soup-4', name: 'Canh khổ qua', category: 'soup' },
      { id: 'soup-5', name: 'Canh cải', category: 'soup' },
    ],
  },
  {
    id: 'hotpot',
    name: 'Hot Pot',
    vnName: 'Nước',
    singleChoice: true,
    dishes: [
      { id: 'hotpot-1', name: 'Lẩu thái', category: 'hotpot' },
      { id: 'hotpot-2', name: 'Lẩu gà', category: 'hotpot' },
      { id: 'hotpot-3', name: 'Lẩu hải sản', category: 'hotpot' },
      { id: 'hotpot-4', name: 'Lẩu nấm', category: 'hotpot' },
      { id: 'hotpot-5', name: 'Lẩu bò', category: 'hotpot' },
    ],
  },
  {
    id: 'sweet_soup',
    name: 'Sweet Soup',
    vnName: 'Chè',
    singleChoice: true,
    dishes: [
      { id: 'sweet-1', name: 'Chè đậu xanh', category: 'sweet_soup' },
      { id: 'sweet-2', name: 'Chè bắp', category: 'sweet_soup' },
      { id: 'sweet-3', name: 'Chè thưng', category: 'sweet_soup' },
      { id: 'sweet-4', name: 'Chè đậu đỏ', category: 'sweet_soup' },
      { id: 'sweet-5', name: 'Chè khoai môn', category: 'sweet_soup' },
    ],
  },
  {
    id: 'mixed_noodle',
    name: 'Mixed Noodle',
    vnName: 'Trộn',
    singleChoice: false,
    dishes: [
      { id: 'noodle-1', name: 'Bún trộn thịt nướng', category: 'mixed_noodle' },
      { id: 'noodle-2', name: 'Miến trộn', category: 'mixed_noodle' },
      { id: 'noodle-3', name: 'Phở trộn', category: 'mixed_noodle' },
      { id: 'noodle-4', name: 'Hủ tiếu trộn', category: 'mixed_noodle' },
      { id: 'noodle-5', name: 'Bún bò trộn', category: 'mixed_noodle' },
    ],
  },
  {
    id: 'mixed_veg',
    name: 'Mixed Vegetables',
    vnName: 'Gỏi',
    singleChoice: false,
    dishes: [
      { id: 'salad-1', name: 'Gỏi gà', category: 'mixed_veg' },
      { id: 'salad-2', name: 'Gỏi tôm', category: 'mixed_veg' },
      { id: 'salad-3', name: 'Gỏi đu đủ', category: 'mixed_veg' },
      { id: 'salad-4', name: 'Gỏi ngó sen', category: 'mixed_veg' },
      { id: 'salad-5', name: 'Gỏi cuốn', category: 'mixed_veg' },
    ],
  },
  {
    id: 'stir_fry',
    name: 'Stir-fry',
    vnName: 'Xào',
    singleChoice: false,
    dishes: [
      { id: 'stirfry-1', name: 'Rau xào thập cẩm', category: 'stir_fry' },
      { id: 'stirfry-2', name: 'Bò xào', category: 'stir_fry' },
      { id: 'stirfry-3', name: 'Mì xào', category: 'stir_fry' },
      { id: 'stirfry-4', name: 'Gà xào sả ớt', category: 'stir_fry' },
      { id: 'stirfry-5', name: 'Đậu que xào', category: 'stir_fry' },
      { id: 'stirfry-6', name: 'Mực xào', category: 'stir_fry' },
    ],
  },
];

export function getDishById(id: string): MenuDish | undefined {
  for (const cat of menuCategories) {
    const dish = cat.dishes.find(d => d.id === id);
    if (dish) return dish;
  }
  return undefined;
}

export function getCategoryConfig(categoryId: MenuCategory): MenuCategoryConfig | undefined {
  return menuCategories.find(c => c.id === categoryId);
}
