-- ============================================================
-- Chef's Pantry Pal — Full Data Reset Script
-- Run this in the Supabase SQL Editor to wipe all kitchen data
-- while preserving the schema and reference data.
-- ============================================================

-- 1. Wipe all transactional data
TRUNCATE TABLE public.order_items      RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.orders           RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.stock_reports    RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.stock_remaining  RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.daily_menus      RESTART IDENTITY CASCADE;

-- 2. Wipe user accounts & roles
TRUNCATE TABLE public.user_roles RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.profiles   RESTART IDENTITY CASCADE;

-- 3. Wipe menu dishes (will re-seed below)
TRUNCATE TABLE public.menu_dishes RESTART IDENTITY CASCADE;

-- 4. Wipe branches (will re-seed below)
TRUNCATE TABLE public.branches RESTART IDENTITY CASCADE;

-- 5. Re-seed branches
INSERT INTO public.branches (id, name, sort_order) VALUES
  ('pnt', 'Phạm Ngọc Thạch', 0),
  ('cn2', 'Chi nhánh 2', 1);

-- 6. Re-seed menu dishes
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

-- 7. Verify all tables are clean
SELECT 'orders'           AS table_name, COUNT(*) AS count FROM public.orders
UNION ALL
SELECT 'order_items',     COUNT(*) FROM public.order_items
UNION ALL
SELECT 'stock_reports',   COUNT(*) FROM public.stock_reports
UNION ALL
SELECT 'stock_remaining', COUNT(*) FROM public.stock_remaining
UNION ALL
SELECT 'daily_menus',     COUNT(*) FROM public.daily_menus
UNION ALL
SELECT 'menu_dishes',     COUNT(*) FROM public.menu_dishes
UNION ALL
SELECT 'branches',        COUNT(*) FROM public.branches
UNION ALL
SELECT 'profiles',        COUNT(*) FROM public.profiles
UNION ALL
SELECT 'user_roles',      COUNT(*) FROM public.user_roles;

-- 8. Verify RLS is still enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'orders','order_items','stock_reports','stock_remaining',
    'daily_menus','menu_dishes','branches','profiles','user_roles'
  );

-- ============================================================
-- AFTER running this SQL, delete old auth users manually:
--
--   Go to: https://supabase.com/dashboard/project/rytxegcnzpkibyytfrsy/auth/users
--   Delete any existing users (chef@kitchen.com, staff@kitchen.com, etc.)
--
-- Then create fresh accounts:
--   Email: chef@kitchen.com    Password: chef123456
--   Email: staff@kitchen.com   Password: staff123456
--
-- The handle_new_user() trigger will auto-create profiles.
-- Then run this to assign roles:
--
--   INSERT INTO public.user_roles (user_id, role)
--   SELECT id, 'chef'::app_role FROM auth.users WHERE email = 'chef@kitchen.com'
--   ON CONFLICT DO NOTHING;
--
--   INSERT INTO public.user_roles (user_id, role)
--   SELECT id, 'kitchen_member'::app_role FROM auth.users WHERE email = 'staff@kitchen.com'
--   ON CONFLICT DO NOTHING;
-- ============================================================
