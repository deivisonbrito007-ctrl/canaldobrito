-- Add custom_logo_url and light_chip columns to channel_logo_mappings
ALTER TABLE public.channel_logo_mappings
  ADD COLUMN IF NOT EXISTS custom_logo_url text,
  ADD COLUMN IF NOT EXISTS light_chip boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS channel_logo_mappings_name_normalized_key
  ON public.channel_logo_mappings (name_normalized);

-- Storage bucket for admin-uploaded channel logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('channel-logos', 'channel-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "Public can read channel-logos" ON storage.objects;
CREATE POLICY "Public can read channel-logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'channel-logos');

-- Admins can upload
DROP POLICY IF EXISTS "Admins can insert channel-logos" ON storage.objects;
CREATE POLICY "Admins can insert channel-logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'channel-logos' AND public.has_role(auth.uid(), 'admin'));

-- Admins can update
DROP POLICY IF EXISTS "Admins can update channel-logos" ON storage.objects;
CREATE POLICY "Admins can update channel-logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'channel-logos' AND public.has_role(auth.uid(), 'admin'));

-- Admins can delete
DROP POLICY IF EXISTS "Admins can delete channel-logos" ON storage.objects;
CREATE POLICY "Admins can delete channel-logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'channel-logos' AND public.has_role(auth.uid(), 'admin'));