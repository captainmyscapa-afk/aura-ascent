
CREATE TABLE public.aurum_core_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'general',
  goal text NOT NULL DEFAULT 'growth',
  level text NOT NULL DEFAULT 'beginner',
  execution_score integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  current_focus text NOT NULL DEFAULT 'onboarding',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.aurum_core_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own core state"
  ON public.aurum_core_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own core state"
  ON public.aurum_core_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own core state"
  ON public.aurum_core_state FOR UPDATE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_aurum_core_state_updated_at
  BEFORE UPDATE ON public.aurum_core_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
