ALTER TABLE public.aurum_core_state
  ADD COLUMN IF NOT EXISTS daily_tasks jsonb,
  ADD COLUMN IF NOT EXISTS daily_tasks_date date,
  ADD COLUMN IF NOT EXISTS upcoming_events jsonb,
  ADD COLUMN IF NOT EXISTS upcoming_events_week_start date;