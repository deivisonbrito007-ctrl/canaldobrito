CREATE TABLE public.daily_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  home_team text NOT NULL,
  away_team text NOT NULL,
  competition text NOT NULL DEFAULT '',
  competition_detail text DEFAULT '',
  game_time time NOT NULL,
  channels text[] DEFAULT '{}',
  is_live boolean NOT NULL DEFAULT false,
  is_womens boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read daily_games" ON public.daily_games FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert daily_games" ON public.daily_games FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update daily_games" ON public.daily_games FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete daily_games" ON public.daily_games FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));