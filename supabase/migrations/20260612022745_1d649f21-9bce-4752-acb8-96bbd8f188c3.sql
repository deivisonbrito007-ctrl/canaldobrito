
-- Fix 1: Remove broad anon UPDATE/DELETE policies on push_subscriptions.
-- Route mutations through SECURITY DEFINER RPCs scoped to a specific endpoint.

DROP POLICY IF EXISTS "Public can delete push_subscriptions by endpoint" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Public can update push_subscriptions by endpoint" ON public.push_subscriptions;

-- Make existing helper RPCs SECURITY DEFINER so they keep working without the broad policies.
CREATE OR REPLACE FUNCTION public.add_push_game_id(_endpoint text, _game_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
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
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.push_subscriptions
  SET game_ids = array_remove(game_ids, _game_id)
  WHERE endpoint = _endpoint;
$$;

-- New RPC for upserting a subscription (key rotation sync), scoped to the supplied endpoint.
CREATE OR REPLACE FUNCTION public.upsert_push_subscription(_endpoint text, _p256dh text, _auth text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _endpoint IS NULL OR char_length(_endpoint) < 10 OR char_length(_endpoint) > 2048 THEN
    RAISE EXCEPTION 'invalid endpoint';
  END IF;
  IF _p256dh IS NULL OR char_length(_p256dh) < 10 OR char_length(_p256dh) > 512 THEN
    RAISE EXCEPTION 'invalid p256dh';
  END IF;
  IF _auth IS NULL OR char_length(_auth) < 4 OR char_length(_auth) > 256 THEN
    RAISE EXCEPTION 'invalid auth';
  END IF;

  INSERT INTO public.push_subscriptions (endpoint, p256dh, auth)
  VALUES (_endpoint, _p256dh, _auth)
  ON CONFLICT (endpoint) DO UPDATE
    SET p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_push_subscription(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_push_game_id(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.remove_push_game_id(text, text) TO anon, authenticated;

-- Fix 2: Guard the settings table so a key whose name looks like a secret
-- can never be stored with is_secret = false (which would expose it publicly).
CREATE OR REPLACE FUNCTION public.enforce_settings_secret_flag()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.key ~* '(secret|token|api[_-]?key|private[_-]?key|password|service[_-]?role|vapid[_-]?private)' THEN
    IF NEW.is_secret IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Setting key % must have is_secret = true', NEW.key;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_settings_secret_flag_trg ON public.settings;
CREATE TRIGGER enforce_settings_secret_flag_trg
BEFORE INSERT OR UPDATE ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.enforce_settings_secret_flag();
