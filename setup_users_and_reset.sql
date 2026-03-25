-- Script to create users and reset data for Chef's Pantry Pal
-- Run this in the Supabase SQL editor

-- 1. Create the two users
-- Note: In a real scenario, you would use Supabase Auth API or dashboard
-- For demonstration, we'll insert directly into auth.users (not recommended for production)
-- But since we need to work with what we have, we'll use the proper approach:

-- First, let's create a function to safely create users if they don't exist
-- However, direct manipulation of auth schema is restricted, so we'll provide instructions

-- Instead, let's work with what we can do: create profiles and user roles
-- assuming the users will be created via email/password signup

-- 2. Clear all application data while preserving schema and default ingredients
-- (Default ingredients are in frontend code, not database)

-- Clear orders and order items
TRUNCATE TABLE public.order_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.orders RESTART IDENTITY CASCADE;

-- Clear stock reports
TRUNCATE TABLE public.stock_reports RESTART IDENTITY CASCADE;

-- Clear stock remaining reports
TRUNCATE TABLE public.stock_remaining RESTART IDENTITY CASCADE;

-- Clear menu dishes (if any were added)
TRUNCATE TABLE public.menu_dishes RESTART IDENTITY CASCADE;

-- Clear daily menus
TRUNCATE TABLE public.daily_menus RESTART IDENTITY CASCADE;

-- Clear branches (keep defaults)
TRUNCATE TABLE public.branches RESTART IDENTITY CASCADE;
-- Re-seed branches
INSERT INTO public.branches (id, name, sort_order) VALUES
  ('pnt', 'Phạm Ngọc Thạch', 0),
  ('cn2', 'Chi nhánh 2', 1);

-- Clear profiles and user roles (will be recreated when users sign in)
TRUNCATE TABLE public.user_roles RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE;

-- 3. Create a function to set up user roles when users sign up
-- This would typically be handled by a trigger on auth.users

-- For now, let's insert the users manually by providing their emails
-- In practice, users would sign up via the app, then we'd update their roles

-- Since we can't directly create auth users via SQL without service role,
-- we'll provide instructions for creating the users and then setting up their data

/*
INSTRUCTIONS FOR CREATING USERS:

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/rytxegcnzpkibyytfrsy
2. Navigate to Authentication > Users
3. Click "Add user" twice to create:
   - Email: bepla@kitchen.com, Password: chef123456
   - Email: vinha@kitchen.com, Password: chef123456
4. Make sure to confirm the emails (or disable email confirmation in settings for testing)

5. After creating the users, run this SQL to set up their profiles and roles:

*/

-- Insert profiles for the users (replace with actual user IDs from auth.users)
-- You'll need to get the user IDs from the auth.users table after creating them

DO $$
DECLARE
  bepla_user_id UUID;
  vinha_user_id UUID;
BEGIN
  -- Get user IDs by email (this requires auth schema access)
  -- In practice, you'd get these from the auth.users table after user creation
  
  -- For demonstration, we'll use placeholder logic
  -- In reality, you would:
  -- 1. Create users via Supabase Auth
  -- 2. Get their IDs from auth.users
  -- 3. Then run the INSERT statements below
  
  RAISE NOTICE 'Please create the users bepla@kitchen.com and vinha@kitchen.com via Supabase Auth first, then run the profile creation queries with their actual user IDs';
END $$;

-- Once you have the user IDs, run these queries:
/*
INSERT INTO public.profiles (id, user_id, display_name) VALUES
  (gen_random_uuid(), 'BEpla_USER_ID_FROM_AUTH', 'Bepla'),
  (gen_random_uuid(), 'VINHA_USER_ID_FROM_AUTH', 'Vinha')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (id, user_id, role) VALUES
  (gen_random_uuid(), 'BEpla_USER_ID_FROM_AUTH', 'chef'),
  (gen_random_uuid(), 'VINHA_USER_ID_FROM_AUTH', 'kitchen_member')
ON CONFLICT (user_id, role) DO NOTHING;
*/

-- 4. Ensure branches are seeded (already done above)

-- 5. Verify tables are clean but schemas preserved
SELECT 
  'orders' as table_name, COUNT(*) as count FROM public.orders UNION ALL
  SELECT 'order_items', COUNT(*) FROM public.order_items UNION ALL
  SELECT 'stock_reports', COUNT(*) FROM public.stock_reports UNION ALL
  SELECT 'stock_remaining', COUNT(*) FROM public.stock_remaining UNION ALL
  SELECT 'menu_dishes', COUNT(*) FROM public.menu_dishes UNION ALL
  SELECT 'daily_menus', COUNT(*) FROM public.daily_menus UNION ALL
  SELECT 'branches', COUNT(*) FROM public.branches UNION ALL
  SELECT 'profiles', COUNT(*) FROM public.profiles UNION ALL
  SELECT 'user_roles', COUNT(*) FROM public.user_roles;

-- 6. Also verify that RLS policies are still enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'order_items', 'stock_reports', 'stock_remaining', 'menu_dishes', 'daily_menus', 'branches', 'profiles', 'user_roles');