
CREATE TABLE public.news_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content_type text NOT NULL DEFAULT 'movie',
  badge_type text NOT NULL DEFAULT 'novidade',
  image_url text,
  overview text,
  year integer,
  rating numeric,
  tmdb_id integer,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  added_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.news_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read news_releases" ON public.news_releases FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert news_releases" ON public.news_releases FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update news_releases" ON public.news_releases FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete news_releases" ON public.news_releases FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
