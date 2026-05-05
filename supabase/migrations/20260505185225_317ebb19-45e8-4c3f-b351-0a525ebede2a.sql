-- Garante de forma definitiva que não existem jogos duplicados
-- (mesma data + times + horário). Funciona como rede de segurança no banco
-- caso o app envie a mesma inserção duas vezes (clique duplo, race condition).
CREATE UNIQUE INDEX IF NOT EXISTS daily_games_natural_key_uidx
ON public.daily_games (date, home_team, away_team, game_time);