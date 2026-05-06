ALTER TABLE public.featured_movies ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_featured_movies_sort_order ON public.featured_movies(sort_order);
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1 AS rn
  FROM public.featured_movies
)
UPDATE public.featured_movies fm SET sort_order = ranked.rn FROM ranked WHERE fm.id = ranked.id;