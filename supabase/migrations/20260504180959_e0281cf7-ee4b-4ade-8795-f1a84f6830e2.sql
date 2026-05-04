-- Add source tracking and external id for API-Football integration
ALTER TABLE public.daily_games
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_id text;

CREATE UNIQUE INDEX IF NOT EXISTS daily_games_external_id_uidx
  ON public.daily_games(external_id)
  WHERE external_id IS NOT NULL;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;