DELETE FROM public.daily_games
WHERE source = 'thesportsdb'
  AND (channels IS NULL OR array_length(channels, 1) IS NULL OR array_length(channels, 1) = 0);