CREATE TABLE public.broadcast_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_pattern text NOT NULL,
  match_type text NOT NULL DEFAULT 'contains' CHECK (match_type IN ('contains','exact','regex')),
  sport_type text,
  channels text[] NOT NULL DEFAULT '{}',
  priority int NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_broadcast_overrides_active ON public.broadcast_overrides(active, priority DESC);

ALTER TABLE public.broadcast_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read broadcast_overrides"
  ON public.broadcast_overrides FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert broadcast_overrides"
  ON public.broadcast_overrides FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update broadcast_overrides"
  ON public.broadcast_overrides FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete broadcast_overrides"
  ON public.broadcast_overrides FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_broadcast_overrides_updated_at
  BEFORE UPDATE ON public.broadcast_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seeds iniciais com base no fallback hardcoded atual
INSERT INTO public.broadcast_overrides (competition_pattern, match_type, sport_type, channels, priority, notes) VALUES
  ('brasileirão', 'contains', 'football', ARRAY['Globo','SporTV','Premiere'], 100, 'Série A'),
  ('brazilian serie a', 'contains', 'football', ARRAY['Globo','SporTV','Premiere'], 100, 'Alias EN'),
  ('brazilian serie b', 'contains', 'football', ARRAY['SporTV','Premiere'], 100, NULL),
  ('copa do brasil', 'contains', 'football', ARRAY['Globo','SporTV','Premiere','Amazon Prime'], 100, NULL),
  ('libertadores', 'contains', 'football', ARRAY['Paramount+','ESPN Brasil','SBT'], 100, NULL),
  ('sudamericana', 'contains', 'football', ARRAY['Paramount+','ESPN Brasil','SBT'], 100, NULL),
  ('champions league', 'contains', 'football', ARRAY['TNT Sports Brasil','HBO Max','SBT'], 100, NULL),
  ('europa league', 'contains', 'football', ARRAY['Cazé TV','Star+'], 100, NULL),
  ('conference league', 'contains', 'football', ARRAY['Cazé TV'], 100, NULL),
  ('formula 1', 'contains', 'motorsport', ARRAY['Band','F1 TV Pro'], 100, NULL),
  ('motogp', 'contains', 'motorsport', ARRAY['DAZN Brasil'], 100, NULL),
  ('stock car', 'contains', 'motorsport', ARRAY['Band','BandSports'], 100, NULL),
  ('ufc', 'contains', 'fighting', ARRAY['Combate','UFC Fight Pass'], 100, NULL);