ALTER TABLE public.featured_series ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at ASC) - 1 AS idx
  FROM public.featured_series
)
UPDATE public.featured_series fs
SET sort_order = ordered.idx
FROM ordered
WHERE fs.id = ordered.id;

ALTER TABLE public.featured_series REPLICA IDENTITY FULL;
ALTER TABLE public.news_releases REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'featured_series'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_series;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'news_releases'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.news_releases;
  END IF;
END $$;