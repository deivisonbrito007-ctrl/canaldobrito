DROP INDEX IF EXISTS public.daily_games_external_id_unique;
CREATE UNIQUE INDEX daily_games_external_id_unique ON public.daily_games (external_id);