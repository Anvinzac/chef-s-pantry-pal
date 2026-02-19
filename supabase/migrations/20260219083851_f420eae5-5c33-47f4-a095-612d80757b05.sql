
-- Create table for remaining stock reports from kitchen members
CREATE TABLE public.stock_remaining (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id text NOT NULL,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '📦',
  category text NOT NULL,
  subcategory text DEFAULT NULL,
  unit text NOT NULL DEFAULT 'kg',
  remaining_quantity numeric NOT NULL,
  reported_by uuid REFERENCES auth.users(id),
  reported_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_remaining ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read stock_remaining"
ON public.stock_remaining FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert stock_remaining"
ON public.stock_remaining FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update their own reports
CREATE POLICY "Allow authenticated update stock_remaining"
ON public.stock_remaining FOR UPDATE
USING (auth.uid() = reported_by);

-- Index for quick lookups
CREATE INDEX idx_stock_remaining_ingredient ON public.stock_remaining(ingredient_id);
CREATE INDEX idx_stock_remaining_reported_at ON public.stock_remaining(reported_at DESC);
