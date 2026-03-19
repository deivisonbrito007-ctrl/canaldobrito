ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS publish_at timestamptz DEFAULT NULL;
ALTER TABLE public.daily_games ADD COLUMN IF NOT EXISTS publish_at timestamptz DEFAULT NULL;