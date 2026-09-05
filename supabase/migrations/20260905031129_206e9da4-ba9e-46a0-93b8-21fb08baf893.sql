ALTER TABLE public.sportsapi_sync_runs
  ADD COLUMN IF NOT EXISTS requests_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_ignored_foreign integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS sportsapi_sync_runs_kind_created_idx ON public.sportsapi_sync_runs (kind, created_at DESC);

INSERT INTO public.settings (key, value) VALUES
  ('sportsapi_auto_fetch', 'true'),
  ('sportsapi_auto_fetch_interval_min', '60'),
  ('sportsapi_live_interval_live_sec', '60'),
  ('sportsapi_ignore_foreign', 'true'),
  ('sportsapi_night_pause', 'true'),
  ('sportsapi_daily_budget', '8000')
ON CONFLICT DO NOTHING;