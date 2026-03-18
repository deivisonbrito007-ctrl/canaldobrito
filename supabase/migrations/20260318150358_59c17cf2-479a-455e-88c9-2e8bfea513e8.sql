
-- 1. Create daily_banner table
CREATE TABLE public.daily_banner (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  date date NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_banner ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read daily_banner" ON public.daily_banner FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert daily_banner" ON public.daily_banner FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update daily_banner" ON public.daily_banner FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete daily_banner" ON public.daily_banner FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. Recreate games table with simplified schema
DROP TABLE IF EXISTS public.games;
DROP TYPE IF EXISTS public.game_status;
DROP TYPE IF EXISTS public.sport_type;
DROP TYPE IF EXISTS public.api_source;

CREATE TABLE public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  time time NOT NULL,
  home_team text NOT NULL,
  away_team text NOT NULL,
  home_logo text,
  away_logo text,
  competition text NOT NULL DEFAULT '',
  channel text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read games" ON public.games FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert games" ON public.games FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update games" ON public.games FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete games" ON public.games FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. Create featured_movies table
CREATE TABLE public.featured_movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id integer NOT NULL UNIQUE,
  title text NOT NULL,
  poster_url text,
  overview text,
  rating numeric(3,1),
  year integer,
  genre text,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.featured_movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read featured_movies" ON public.featured_movies FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert featured_movies" ON public.featured_movies FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update featured_movies" ON public.featured_movies FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete featured_movies" ON public.featured_movies FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. Create featured_series table
CREATE TABLE public.featured_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id integer NOT NULL UNIQUE,
  title text NOT NULL,
  poster_url text,
  overview text,
  rating numeric(3,1),
  year integer,
  genre text,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.featured_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read featured_series" ON public.featured_series FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert featured_series" ON public.featured_series FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update featured_series" ON public.featured_series FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete featured_series" ON public.featured_series FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. Create settings table
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.settings FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert settings" ON public.settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update settings" ON public.settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES
  ('whatsapp', '5511940759046'),
  ('tmdb_api_key', '');

-- 6. Create trigger for settings updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
