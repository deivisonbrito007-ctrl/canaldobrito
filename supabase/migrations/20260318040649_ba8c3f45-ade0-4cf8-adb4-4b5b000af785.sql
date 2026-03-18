
-- Create banner_category enum
CREATE TYPE public.banner_category AS ENUM ('cover', 'football', 'basketball', 'ufc', 'other_sports', 'football_guide');

-- Create banners table
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  category public.banner_category NOT NULL DEFAULT 'cover',
  title TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read active banners"
ON public.banners FOR SELECT TO public
USING (true);

-- Admin CRUD
CREATE POLICY "Admins can insert banners"
ON public.banners FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update banners"
ON public.banners FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete banners"
ON public.banners FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for banners
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

-- Storage policies: public read
CREATE POLICY "Public can read banner files"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'banners');

-- Admin upload
CREATE POLICY "Admins can upload banner files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));

-- Admin delete
CREATE POLICY "Admins can delete banner files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));
