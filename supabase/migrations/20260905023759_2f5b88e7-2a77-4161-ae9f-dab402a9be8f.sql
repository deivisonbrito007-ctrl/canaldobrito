ALTER TABLE public.daily_games
  ADD COLUMN IF NOT EXISTS external_source text,
  ADD COLUMN IF NOT EXISTS external_sport text,
  ADD COLUMN IF NOT EXISTS api_status text,
  ADD COLUMN IF NOT EXISTS live_clock text,
  ADD COLUMN IF NOT EXISTS period text,
  ADD COLUMN IF NOT EXISTS broadcast_country text,
  ADD COLUMN IF NOT EXISTS last_api_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS api_payload_summary jsonb;

CREATE INDEX IF NOT EXISTS daily_games_external_idx
  ON public.daily_games (external_source, external_id)
  WHERE external_id IS NOT NULL;

CREATE TABLE public.sportsapi_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  kind text NOT NULL DEFAULT 'fetch',
  sports text[] NOT NULL DEFAULT '{}',
  total_found integer NOT NULL DEFAULT 0,
  total_with_transmission integer NOT NULL DEFAULT 0,
  total_ignored_no_transmission integer NOT NULL DEFAULT 0,
  total_ready integer NOT NULL DEFAULT 0,
  total_review integer NOT NULL DEFAULT 0,
  total_duplicates integer NOT NULL DEFAULT 0,
  total_updated integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ok',
  error_message text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sportsapi_sync_runs TO authenticated;
GRANT ALL ON public.sportsapi_sync_runs TO service_role;
ALTER TABLE public.sportsapi_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sportsapi_sync_runs" ON public.sportsapi_sync_runs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX sportsapi_sync_runs_date_idx ON public.sportsapi_sync_runs (date, created_at DESC);

CREATE TABLE public.sportsapi_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  external_id text NOT NULL,
  sport text NOT NULL,
  sport_type text NOT NULL DEFAULT 'football',
  title text,
  home_team text NOT NULL DEFAULT '',
  away_team text NOT NULL DEFAULT '',
  competition text NOT NULL DEFAULT '',
  competition_country text,
  start_time timestamptz NOT NULL,
  game_time time NOT NULL,
  tv_networks jsonb NOT NULL DEFAULT '[]'::jsonb,
  normalized_channels text[] NOT NULL DEFAULT '{}',
  broadcast_country text,
  api_status text,
  home_score integer,
  away_score integer,
  live_clock text,
  period text,
  status text NOT NULL DEFAULT 'revisar',
  review_status text NOT NULL DEFAULT 'pending',
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  matched_game_id uuid,
  imported_game_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (external_id, sport)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sportsapi_suggestions TO authenticated;
GRANT ALL ON public.sportsapi_suggestions TO service_role;
ALTER TABLE public.sportsapi_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sportsapi_suggestions" ON public.sportsapi_suggestions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX sportsapi_suggestions_date_idx ON public.sportsapi_suggestions (date, status);
CREATE TRIGGER trg_sportsapi_suggestions_updated_at
  BEFORE UPDATE ON public.sportsapi_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER sportsapi_suggestions_change_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.sportsapi_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

INSERT INTO public.settings (key, value) VALUES
  ('sportsapi_enabled', 'true'),
  ('sportsapi_mode', 'sugestoes'),
  ('sportsapi_sports_enabled', 'football,tennis,basketball,mma,volleyball,futsal,nfl,mlb,f1,motogp,cycling,surf,golf'),
  ('sportsapi_sports_priority', 'football,basketball,tennis,mma,volleyball,f1'),
  ('sportsapi_brazil_only', 'true'),
  ('sportsapi_accept_known_channel', 'true'),
  ('sportsapi_live_updates', 'true'),
  ('sportsapi_live_interval_min', '3'),
  ('sportsapi_max_per_sport', '40')
ON CONFLICT DO NOTHING;