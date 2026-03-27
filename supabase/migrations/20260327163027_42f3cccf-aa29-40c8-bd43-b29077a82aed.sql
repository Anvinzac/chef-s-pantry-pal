
-- 1. Create restaurants table
CREATE TABLE public.restaurants (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read restaurants" ON public.restaurants FOR SELECT TO public USING (true);

-- 2. Add restaurant_id to user_roles
ALTER TABLE public.user_roles ADD COLUMN restaurant_id text REFERENCES public.restaurants(id);

-- 3. Add restaurant_id to branches
ALTER TABLE public.branches ADD COLUMN restaurant_id text REFERENCES public.restaurants(id);

-- 4. Add restaurant_id to orders
ALTER TABLE public.orders ADD COLUMN restaurant_id text REFERENCES public.restaurants(id);

-- 5. Add restaurant_id to order_items
ALTER TABLE public.order_items ADD COLUMN restaurant_id text REFERENCES public.restaurants(id);

-- 6. Add restaurant_id to stock_reports
ALTER TABLE public.stock_reports ADD COLUMN restaurant_id text REFERENCES public.restaurants(id);

-- 7. Add restaurant_id to stock_remaining
ALTER TABLE public.stock_remaining ADD COLUMN restaurant_id text REFERENCES public.restaurants(id);

-- 8. Add restaurant_id to daily_menus
ALTER TABLE public.daily_menus ADD COLUMN restaurant_id text REFERENCES public.restaurants(id);

-- 9. Add restaurant_id to menu_dishes
ALTER TABLE public.menu_dishes ADD COLUMN restaurant_id text REFERENCES public.restaurants(id);

-- 10. Create security definer function to get user's restaurant
CREATE OR REPLACE FUNCTION public.get_user_restaurant()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT restaurant_id FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- 11. Seed restaurants
INSERT INTO public.restaurants (id, name, slug) VALUES
  ('quanchay', 'La Vegetarian', 'quanchay'),
  ('vinha', 'ViNha Restaurant', 'vinha');

-- 12. Assign existing branches to La Vegetarian
UPDATE public.branches SET restaurant_id = 'quanchay';

-- 13. Create default branch for ViNha
INSERT INTO public.branches (id, name, sort_order, restaurant_id) VALUES
  ('vinha-main', 'ViNha Chính', 0, 'vinha');

-- 14. Assign existing menu_dishes to La Vegetarian
UPDATE public.menu_dishes SET restaurant_id = 'quanchay';

-- 15. Duplicate menu_dishes for ViNha
INSERT INTO public.menu_dishes (id, name, category, sort_order, restaurant_id)
SELECT 'vinha-' || id, name, category, sort_order, 'vinha'
FROM public.menu_dishes WHERE restaurant_id = 'quanchay';

-- 16. Assign existing orders to La Vegetarian
UPDATE public.orders SET restaurant_id = 'quanchay';
UPDATE public.order_items SET restaurant_id = 'quanchay';
UPDATE public.stock_reports SET restaurant_id = 'quanchay';
UPDATE public.stock_remaining SET restaurant_id = 'quanchay';
UPDATE public.daily_menus SET restaurant_id = 'quanchay';

-- 17. Update existing user_roles to La Vegetarian
UPDATE public.user_roles SET restaurant_id = 'quanchay';

-- 18. Drop old RLS policies and create restaurant-scoped ones

-- branches
DROP POLICY IF EXISTS "Allow public read branches" ON public.branches;
DROP POLICY IF EXISTS "Allow public insert branches" ON public.branches;
DROP POLICY IF EXISTS "Allow public update branches" ON public.branches;
CREATE POLICY "Read own restaurant branches" ON public.branches FOR SELECT TO public
  USING (restaurant_id = public.get_user_restaurant() OR auth.uid() IS NULL);
CREATE POLICY "Insert own restaurant branches" ON public.branches FOR INSERT TO public
  WITH CHECK (restaurant_id = public.get_user_restaurant());
CREATE POLICY "Update own restaurant branches" ON public.branches FOR UPDATE TO public
  USING (restaurant_id = public.get_user_restaurant());

-- orders
DROP POLICY IF EXISTS "Allow public read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public delete orders" ON public.orders;
CREATE POLICY "Read own restaurant orders" ON public.orders FOR SELECT TO public
  USING (restaurant_id = public.get_user_restaurant());
CREATE POLICY "Insert own restaurant orders" ON public.orders FOR INSERT TO public
  WITH CHECK (restaurant_id = public.get_user_restaurant());
CREATE POLICY "Delete own restaurant orders" ON public.orders FOR DELETE TO public
  USING (restaurant_id = public.get_user_restaurant());

-- order_items
DROP POLICY IF EXISTS "Allow public read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public insert order_items" ON public.order_items;
CREATE POLICY "Read own restaurant order_items" ON public.order_items FOR SELECT TO public
  USING (restaurant_id = public.get_user_restaurant());
CREATE POLICY "Insert own restaurant order_items" ON public.order_items FOR INSERT TO public
  WITH CHECK (restaurant_id = public.get_user_restaurant());

-- stock_reports
DROP POLICY IF EXISTS "Allow public read stock_reports" ON public.stock_reports;
DROP POLICY IF EXISTS "Allow public insert stock_reports" ON public.stock_reports;
DROP POLICY IF EXISTS "Allow public update stock_reports" ON public.stock_reports;
CREATE POLICY "Read own restaurant stock_reports" ON public.stock_reports FOR SELECT TO public
  USING (restaurant_id = public.get_user_restaurant());
CREATE POLICY "Insert own restaurant stock_reports" ON public.stock_reports FOR INSERT TO public
  WITH CHECK (restaurant_id = public.get_user_restaurant());
CREATE POLICY "Update own restaurant stock_reports" ON public.stock_reports FOR UPDATE TO public
  USING (restaurant_id = public.get_user_restaurant());

-- stock_remaining
DROP POLICY IF EXISTS "Allow authenticated read stock_remaining" ON public.stock_remaining;
DROP POLICY IF EXISTS "Allow authenticated insert stock_remaining" ON public.stock_remaining;
DROP POLICY IF EXISTS "Allow authenticated update stock_remaining" ON public.stock_remaining;
CREATE POLICY "Read own restaurant stock_remaining" ON public.stock_remaining FOR SELECT TO public
  USING (restaurant_id = public.get_user_restaurant());
CREATE POLICY "Insert own restaurant stock_remaining" ON public.stock_remaining FOR INSERT TO public
  WITH CHECK (restaurant_id = public.get_user_restaurant());
CREATE POLICY "Update own restaurant stock_remaining" ON public.stock_remaining FOR UPDATE TO public
  USING (restaurant_id = public.get_user_restaurant());

-- daily_menus
DROP POLICY IF EXISTS "Allow public read daily_menus" ON public.daily_menus;
DROP POLICY IF EXISTS "Allow public insert daily_menus" ON public.daily_menus;
DROP POLICY IF EXISTS "Allow public update daily_menus" ON public.daily_menus;
CREATE POLICY "Read own restaurant daily_menus" ON public.daily_menus FOR SELECT TO public
  USING (restaurant_id = public.get_user_restaurant());
CREATE POLICY "Insert own restaurant daily_menus" ON public.daily_menus FOR INSERT TO public
  WITH CHECK (restaurant_id = public.get_user_restaurant());
CREATE POLICY "Update own restaurant daily_menus" ON public.daily_menus FOR UPDATE TO public
  USING (restaurant_id = public.get_user_restaurant());

-- menu_dishes (scoped but allow guest read of quanchay for demo)
DROP POLICY IF EXISTS "Allow public read menu_dishes" ON public.menu_dishes;
DROP POLICY IF EXISTS "Allow public insert menu_dishes" ON public.menu_dishes;
DROP POLICY IF EXISTS "Allow public update menu_dishes" ON public.menu_dishes;
DROP POLICY IF EXISTS "Allow public delete menu_dishes" ON public.menu_dishes;
CREATE POLICY "Read own restaurant menu_dishes" ON public.menu_dishes FOR SELECT TO public
  USING (restaurant_id = public.get_user_restaurant() OR auth.uid() IS NULL);
CREATE POLICY "Insert own restaurant menu_dishes" ON public.menu_dishes FOR INSERT TO public
  WITH CHECK (restaurant_id = public.get_user_restaurant());
CREATE POLICY "Update own restaurant menu_dishes" ON public.menu_dishes FOR UPDATE TO public
  USING (restaurant_id = public.get_user_restaurant());
CREATE POLICY "Delete own restaurant menu_dishes" ON public.menu_dishes FOR DELETE TO public
  USING (restaurant_id = public.get_user_restaurant());
