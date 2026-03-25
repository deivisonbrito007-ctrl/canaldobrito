
CREATE OR REPLACE FUNCTION public.add_push_game_id(_endpoint text, _game_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE push_subscriptions
  SET game_ids = array_append(game_ids, _game_id)
  WHERE endpoint = _endpoint
    AND NOT (_game_id = ANY(game_ids));
$$;

CREATE OR REPLACE FUNCTION public.remove_push_game_id(_endpoint text, _game_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE push_subscriptions
  SET game_ids = array_remove(game_ids, _game_id)
  WHERE endpoint = _endpoint;
$$;
