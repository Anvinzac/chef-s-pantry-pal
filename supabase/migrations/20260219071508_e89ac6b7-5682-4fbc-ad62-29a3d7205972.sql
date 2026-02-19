
-- Create branches table
CREATE TABLE public.branches (
  id text PRIMARY KEY,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Allow public insert branches" ON public.branches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update branches" ON public.branches FOR UPDATE USING (true);

-- Seed branches
INSERT INTO public.branches (id, name, sort_order) VALUES
  ('pnt', 'Phạm Ngọc Thạch', 0),
  ('cn2', 'Chi nhánh 2', 1);

-- Add branch_id to daily_menus with default
ALTER TABLE public.daily_menus ADD COLUMN branch_id text NOT NULL DEFAULT 'pnt';

-- Drop existing unique constraint on menu_date if any, and add composite unique
-- First check: daily_menus has a unique constraint on menu_date (used by upsert onConflict)
-- We need to make it (menu_date, branch_id)
ALTER TABLE public.daily_menus DROP CONSTRAINT IF EXISTS daily_menus_menu_date_key;
CREATE UNIQUE INDEX daily_menus_menu_date_branch_id_key ON public.daily_menus (menu_date, branch_id);
