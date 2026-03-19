ALTER TABLE public.news_releases
  ADD COLUMN genres text,
  ADD COLUMN runtime integer,
  ADD COLUMN seasons integer,
  ADD COLUMN tagline text;