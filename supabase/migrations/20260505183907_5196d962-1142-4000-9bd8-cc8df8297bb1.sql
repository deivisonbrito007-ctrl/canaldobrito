
-- Remove API sync system completely
DROP FUNCTION IF EXISTS public.set_api_sync_paused(boolean);
DROP TABLE IF EXISTS public.league_allowlist CASCADE;
DROP TABLE IF EXISTS public.channel_whitelist CASCADE;
DROP TABLE IF EXISTS public.broadcast_overrides CASCADE;
ALTER TABLE public.daily_games DROP COLUMN IF EXISTS channels_source;
ALTER TABLE public.daily_games DROP COLUMN IF EXISTS external_id;
