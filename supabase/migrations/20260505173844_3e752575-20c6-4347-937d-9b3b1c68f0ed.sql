
-- 1) Tabela de ligas permitidas
CREATE TABLE public.league_allowlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_pattern text NOT NULL,
  match_type text NOT NULL DEFAULT 'contains' CHECK (match_type IN ('contains','exact','regex')),
  sport_type text,
  priority int NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_league_allowlist_active ON public.league_allowlist(active, priority DESC);

ALTER TABLE public.league_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read league_allowlist"
  ON public.league_allowlist FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert league_allowlist"
  ON public.league_allowlist FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update league_allowlist"
  ON public.league_allowlist FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete league_allowlist"
  ON public.league_allowlist FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_league_allowlist_updated_at
  BEFORE UPDATE ON public.league_allowlist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Seeds: ligas que fazem sentido para o público brasileiro
INSERT INTO public.league_allowlist (competition_pattern, match_type, sport_type, notes) VALUES
  -- Futebol Brasil
  ('brazilian serie a', 'contains', 'football', 'Brasileirão Série A'),
  ('brasileir', 'contains', 'football', 'Brasileirão (PT)'),
  ('brazilian serie b', 'contains', 'football', 'Série B'),
  ('brazilian serie c', 'contains', 'football', 'Série C'),
  ('copa do brasil', 'contains', 'football', NULL),
  ('paulist', 'contains', 'football', 'Paulistão'),
  ('carioca', 'contains', 'football', NULL),
  ('mineiro', 'contains', 'football', NULL),
  ('gaúcho', 'contains', 'football', NULL),
  ('gaucho', 'contains', 'football', NULL),
  -- Sul-América
  ('libertadores', 'contains', 'football', NULL),
  ('sudamericana', 'contains', 'football', NULL),
  ('sul-americana', 'contains', 'football', NULL),
  ('recopa', 'contains', 'football', NULL),
  ('conmebol', 'contains', 'football', NULL),
  -- Europa principais
  ('champions league', 'contains', 'football', 'UEFA Champions League'),
  ('europa league', 'contains', 'football', NULL),
  ('conference league', 'contains', 'football', NULL),
  ('premier league', 'contains', 'football', 'Inglaterra'),
  ('english premier', 'contains', 'football', NULL),
  ('la liga', 'contains', 'football', 'Espanha'),
  ('spanish la liga', 'contains', 'football', NULL),
  ('italian serie a', 'contains', 'football', 'Itália'),
  ('bundesliga', 'contains', 'football', 'Alemanha'),
  ('ligue 1', 'contains', 'football', 'França'),
  ('french ligue 1', 'contains', 'football', NULL),
  -- Seleções
  ('world cup', 'contains', 'football', 'Copa do Mundo'),
  ('copa do mundo', 'contains', 'football', NULL),
  ('copa america', 'contains', 'football', NULL),
  ('copa américa', 'contains', 'football', NULL),
  ('uefa euro', 'contains', 'football', NULL),
  ('eurocopa', 'contains', 'football', NULL),
  -- USA
  ('mls', 'exact', 'football', 'Major League Soccer'),
  -- Basquete
  ('nba', 'exact', 'basketball', NULL),
  ('nbb', 'exact', 'basketball', 'Brasil'),
  ('euroleague', 'contains', 'basketball', NULL),
  -- Beisebol
  ('mlb', 'exact', 'baseball', NULL),
  -- Hockey
  ('nhl', 'exact', 'hockey', NULL),
  -- NFL
  ('nfl', 'exact', 'football', 'NFL (mapeada como football)'),
  ('national football league', 'contains', 'football', NULL),
  -- Motor
  ('formula 1', 'contains', 'f1', NULL),
  ('formula one', 'contains', 'f1', NULL),
  ('motogp', 'contains', 'f1', NULL),
  ('stock car', 'contains', 'f1', NULL),
  -- Lutas
  ('ufc', 'contains', 'mma', NULL),
  -- Vôlei
  ('superliga', 'contains', 'volleyball', 'Superliga Brasil'),
  -- Tênis
  ('atp', 'contains', 'tennis', NULL),
  ('wta', 'contains', 'tennis', NULL),
  ('grand slam', 'contains', 'tennis', NULL),
  ('roland garros', 'contains', 'tennis', NULL),
  ('wimbledon', 'contains', 'tennis', NULL),
  ('us open', 'contains', 'tennis', NULL),
  ('australian open', 'contains', 'tennis', NULL);

-- 3) Desativar overrides genéricos perigosos (Libertadores/Sudamericana já replicavam em todos os jogos)
UPDATE public.broadcast_overrides
SET active = false,
    notes = COALESCE(notes,'') || ' [desativado: causava transmissão repetida]'
WHERE competition_pattern IN ('libertadores','sudamericana','champions league','europa league','conference league','copa do brasil','brasileirão','brazilian serie a','brazilian serie b');
