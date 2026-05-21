ALTER TABLE public.live_intelligence ADD COLUMN IF NOT EXISTS category text;
CREATE INDEX IF NOT EXISTS live_intelligence_category_idx ON public.live_intelligence (category);
CREATE INDEX IF NOT EXISTS live_intelligence_created_at_idx ON public.live_intelligence (created_at DESC);