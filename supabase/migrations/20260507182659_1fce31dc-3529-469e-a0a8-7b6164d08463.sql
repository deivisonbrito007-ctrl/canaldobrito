
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.add_push_game_id(_endpoint text, _game_id text)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE public.push_subscriptions
  SET game_ids = array_append(game_ids, _game_id)
  WHERE endpoint = _endpoint
    AND NOT (_game_id = ANY(game_ids));
$$;

CREATE OR REPLACE FUNCTION public.remove_push_game_id(_endpoint text, _game_id text)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE public.push_subscriptions
  SET game_ids = array_remove(game_ids, _game_id)
  WHERE endpoint = _endpoint;
$$;
