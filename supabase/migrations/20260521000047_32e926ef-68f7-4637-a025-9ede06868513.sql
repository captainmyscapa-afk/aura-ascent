
CREATE TABLE public.live_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  url TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.live_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Live intelligence is publicly readable"
  ON public.live_intelligence FOR SELECT
  USING (true);

CREATE INDEX live_intelligence_published_at_idx
  ON public.live_intelligence (published_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_intelligence;
ALTER TABLE public.live_intelligence REPLICA IDENTITY FULL;
