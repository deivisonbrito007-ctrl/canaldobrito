
CREATE OR REPLACE FUNCTION public.remove_multiple_game_ids(_endpoint text, _ids text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _id text;
BEGIN
  UPDATE push_subscriptions
  SET game_ids = (
    SELECT COALESCE(array_agg(elem), '{}')
    FROM unnest(game_ids) AS elem
    WHERE elem != ALL(_ids)
  )
  WHERE endpoint = _endpoint;
END;
$$;
