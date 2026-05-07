CREATE TABLE public.channel_logo_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_normalized text NOT NULL UNIQUE,
  logo_key text NOT NULL DEFAULT 'none',
  short text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_channel_logo_mappings_normalized ON public.channel_logo_mappings(name_normalized) WHERE active = true;

ALTER TABLE public.channel_logo_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read channel_logo_mappings"
  ON public.channel_logo_mappings FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert channel_logo_mappings"
  ON public.channel_logo_mappings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update channel_logo_mappings"
  ON public.channel_logo_mappings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete channel_logo_mappings"
  ON public.channel_logo_mappings FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_channel_logo_mappings_updated_at
  BEFORE UPDATE ON public.channel_logo_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();