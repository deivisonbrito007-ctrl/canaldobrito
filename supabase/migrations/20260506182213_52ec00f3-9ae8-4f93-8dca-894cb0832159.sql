ALTER TABLE public.daily_games
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS home_score integer,
  ADD COLUMN IF NOT EXISTS away_score integer,
  ADD COLUMN IF NOT EXISTS live_status text,
  ADD COLUMN IF NOT EXISTS live_updated_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS daily_games_external_id_uidx
  ON public.daily_games(external_id) WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS daily_games_live_idx
  ON public.daily_games(date, live_status);