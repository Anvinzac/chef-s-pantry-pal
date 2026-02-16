
-- Table for out-of-stock reports
CREATE TABLE public.stock_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id TEXT NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📦',
  category TEXT NOT NULL,
  subcategory TEXT,
  unit TEXT NOT NULL DEFAULT 'kg',
  reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.stock_reports ENABLE ROW LEVEL SECURITY;

-- Public read/insert/update policies (no auth)
CREATE POLICY "Allow public read stock_reports" ON public.stock_reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert stock_reports" ON public.stock_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update stock_reports" ON public.stock_reports FOR UPDATE USING (true);

-- Index for quick lookups of unresolved reports
CREATE INDEX idx_stock_reports_unresolved ON public.stock_reports (ingredient_id) WHERE resolved_at IS NULL;
