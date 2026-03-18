
-- Enum for game status
CREATE TYPE public.game_status AS ENUM ('scheduled', 'live', 'finished');

-- Enum for sport type
CREATE TYPE public.sport_type AS ENUM ('football', 'basketball', 'esports', 'mma');

-- Enum for API source
CREATE TYPE public.api_source AS ENUM ('api-football', 'balldontlie', 'pandascore', 'manual');

-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Games table
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sport public.sport_type NOT NULL,
  league TEXT NOT NULL,
  league_icon TEXT,
  home_team_name TEXT NOT NULL,
  home_team_logo TEXT,
  home_team_score INTEGER,
  away_team_name TEXT NOT NULL,
  away_team_logo TEXT,
  away_team_score INTEGER,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status public.game_status NOT NULL DEFAULT 'scheduled',
  venue TEXT,
  round TEXT,
  highlight BOOLEAN NOT NULL DEFAULT false,
  api_source public.api_source DEFAULT 'manual',
  external_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Games: public read
CREATE POLICY "Anyone can read games"
  ON public.games FOR SELECT
  USING (true);

-- Games: admin insert
CREATE POLICY "Admins can insert games"
  ON public.games FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Games: admin update
CREATE POLICY "Admins can update games"
  ON public.games FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Games: admin delete
CREATE POLICY "Admins can delete games"
  ON public.games FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles: only admins can read
CREATE POLICY "Admins can read user_roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_games_sport ON public.games(sport);
CREATE INDEX idx_games_status ON public.games(status);
CREATE INDEX idx_games_start_time ON public.games(start_time);
CREATE INDEX idx_games_external_id ON public.games(external_id);
