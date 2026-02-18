
-- Create updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create daily_menus table
CREATE TABLE public.daily_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_date DATE NOT NULL UNIQUE,
  dishes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read daily_menus" ON public.daily_menus FOR SELECT USING (true);
CREATE POLICY "Allow public insert daily_menus" ON public.daily_menus FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update daily_menus" ON public.daily_menus FOR UPDATE USING (true);

CREATE TRIGGER update_daily_menus_updated_at
BEFORE UPDATE ON public.daily_menus
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
