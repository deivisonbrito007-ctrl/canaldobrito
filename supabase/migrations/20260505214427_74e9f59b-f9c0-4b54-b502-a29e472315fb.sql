ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_games;
ALTER TABLE public.daily_games REPLICA IDENTITY FULL;