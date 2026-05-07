CREATE TABLE public.channel_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id uuid NOT NULL REFERENCES public.channel_logo_mappings(id) ON DELETE CASCADE,
  alias text NOT NULL,
  alias_normalized text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_channel_aliases_mapping_id ON public.channel_aliases(mapping_id);

ALTER TABLE public.channel_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read channel_aliases"
  ON public.channel_aliases FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert channel_aliases"
  ON public.channel_aliases FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update channel_aliases"
  ON public.channel_aliases FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete channel_aliases"
  ON public.channel_aliases FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));