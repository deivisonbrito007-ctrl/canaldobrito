
-- 1) channel_whitelist
CREATE TABLE public.channel_whitelist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_pattern TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'contains',
  country TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.channel_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read channel_whitelist" ON public.channel_whitelist FOR SELECT USING (true);
CREATE POLICY "Admins can insert channel_whitelist" ON public.channel_whitelist FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update channel_whitelist" ON public.channel_whitelist FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete channel_whitelist" ON public.channel_whitelist FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_channel_whitelist_updated_at
BEFORE UPDATE ON public.channel_whitelist
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) broadcast_overrides: novos campos de match por partida
ALTER TABLE public.broadcast_overrides
  ADD COLUMN IF NOT EXISTS home_team_pattern TEXT,
  ADD COLUMN IF NOT EXISTS away_team_pattern TEXT,
  ADD COLUMN IF NOT EXISTS event_date DATE;

-- 3) daily_games: origem dos canais (auditoria)
ALTER TABLE public.daily_games
  ADD COLUMN IF NOT EXISTS channels_source JSONB DEFAULT '{}'::jsonb;

-- 4) Seed inicial whitelist global
INSERT INTO public.channel_whitelist (channel_pattern, match_type, country, notes) VALUES
  ('NBA League Pass', 'contains', 'World', 'Pass oficial NBA, válido no BR'),
  ('MLB.tv', 'contains', 'World', 'Pass oficial MLB'),
  ('MLB TV', 'contains', 'World', 'Pass oficial MLB'),
  ('F1 TV', 'contains', 'World', 'F1 TV Pro/Access — válido no BR'),
  ('UFC Fight Pass', 'contains', 'World', 'Streaming oficial UFC'),
  ('DAZN', 'contains', 'World', 'DAZN — disponível no BR'),
  ('Disney+', 'contains', 'World', 'Disney Plus global'),
  ('Disney Plus', 'contains', 'World', 'Disney Plus global'),
  ('Star+', 'contains', 'World', 'Star Plus global'),
  ('Max', 'exact', 'World', 'HBO Max → Max global'),
  ('HBO Max', 'contains', 'World', 'HBO Max global'),
  ('Paramount+', 'contains', 'World', 'Paramount Plus global'),
  ('Apple TV+', 'contains', 'World', 'Apple TV Plus (MLS Season Pass)'),
  ('Prime Video', 'contains', 'World', 'Amazon Prime Video global'),
  ('YouTube', 'contains', 'World', 'Transmissões oficiais no YouTube');
