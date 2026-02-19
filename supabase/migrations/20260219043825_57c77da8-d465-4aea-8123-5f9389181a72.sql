
-- Create menu_dishes table
CREATE TABLE public.menu_dishes (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_dishes ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read menu_dishes"
ON public.menu_dishes
FOR SELECT
USING (true);

-- Public insert/update/delete for managing dishes
CREATE POLICY "Allow public insert menu_dishes"
ON public.menu_dishes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update menu_dishes"
ON public.menu_dishes
FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete menu_dishes"
ON public.menu_dishes
FOR DELETE
USING (true);

-- Index for category filtering
CREATE INDEX idx_menu_dishes_category ON public.menu_dishes (category, sort_order);

-- Seed with existing data
INSERT INTO public.menu_dishes (id, name, category, sort_order) VALUES
('boiled-1', 'Gà luộc', 'boiled', 1),
('boiled-2', 'Bắp bò luộc', 'boiled', 2),
('boiled-3', 'Tôm luộc', 'boiled', 3),
('boiled-4', 'Trứng luộc', 'boiled', 4),
('boiled-5', 'Rau luộc', 'boiled', 5),
('boiled-6', 'Heo luộc', 'boiled', 6),
('stew-1', 'Thịt kho trứng', 'stew', 1),
('stew-2', 'Cá kho tộ', 'stew', 2),
('stew-3', 'Sườn kho', 'stew', 3),
('stew-4', 'Đậu hũ kho', 'stew', 4),
('stew-5', 'Thịt kho tiêu', 'stew', 5),
('stew-6', 'Gà kho gừng', 'stew', 6),
('fried-1', 'Cá chiên', 'fried', 1),
('fried-2', 'Đậu hũ chiên', 'fried', 2),
('fried-3', 'Gà chiên', 'fried', 3),
('fried-4', 'Chả giò', 'fried', 4),
('fried-5', 'Tôm chiên', 'fried', 5),
('fried-6', 'Nem rán', 'fried', 6),
('soup-1', 'Canh chua', 'soup', 1),
('soup-2', 'Canh bí đao', 'soup', 2),
('soup-3', 'Canh rau muống', 'soup', 3),
('soup-4', 'Canh khổ qua', 'soup', 4),
('soup-5', 'Canh cải', 'soup', 5),
('hotpot-1', 'Lẩu thái', 'hotpot', 1),
('hotpot-2', 'Lẩu gà', 'hotpot', 2),
('hotpot-3', 'Lẩu hải sản', 'hotpot', 3),
('hotpot-4', 'Lẩu nấm', 'hotpot', 4),
('hotpot-5', 'Lẩu bò', 'hotpot', 5),
('sweet-1', 'Chè đậu xanh', 'sweet_soup', 1),
('sweet-2', 'Chè bắp', 'sweet_soup', 2),
('sweet-3', 'Chè thưng', 'sweet_soup', 3),
('sweet-4', 'Chè đậu đỏ', 'sweet_soup', 4),
('sweet-5', 'Chè khoai môn', 'sweet_soup', 5),
('noodle-1', 'Bún trộn thịt nướng', 'mixed_noodle', 1),
('noodle-2', 'Miến trộn', 'mixed_noodle', 2),
('noodle-3', 'Phở trộn', 'mixed_noodle', 3),
('noodle-4', 'Hủ tiếu trộn', 'mixed_noodle', 4),
('noodle-5', 'Bún bò trộn', 'mixed_noodle', 5),
('salad-1', 'Gỏi gà', 'mixed_veg', 1),
('salad-2', 'Gỏi tôm', 'mixed_veg', 2),
('salad-3', 'Gỏi đu đủ', 'mixed_veg', 3),
('salad-4', 'Gỏi ngó sen', 'mixed_veg', 4),
('salad-5', 'Gỏi cuốn', 'mixed_veg', 5),
('stirfry-1', 'Rau xào thập cẩm', 'stir_fry', 1),
('stirfry-2', 'Bò xào', 'stir_fry', 2),
('stirfry-3', 'Mì xào', 'stir_fry', 3),
('stirfry-4', 'Gà xào sả ớt', 'stir_fry', 4),
('stirfry-5', 'Đậu que xào', 'stir_fry', 5),
('stirfry-6', 'Mực xào', 'stir_fry', 6);
