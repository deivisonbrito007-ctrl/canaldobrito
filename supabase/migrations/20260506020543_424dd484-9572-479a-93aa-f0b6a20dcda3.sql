-- Índice único para impedir jogos exatamente idênticos (mesma data, times normalizados, horário e esporte)
-- Restrito a registros não-arquivados para preservar histórico arquivado.
CREATE UNIQUE INDEX IF NOT EXISTS daily_games_unique_event
  ON public.daily_games (
    date,
    lower(btrim(home_team)),
    lower(btrim(coalesce(away_team, ''))),
    game_time,
    sport_type
  )
  WHERE archived = false;