ALTER TABLE public.featured_movies ADD COLUMN IF NOT EXISTS backdrop_url text;
ALTER TABLE public.featured_series ADD COLUMN IF NOT EXISTS backdrop_url text;