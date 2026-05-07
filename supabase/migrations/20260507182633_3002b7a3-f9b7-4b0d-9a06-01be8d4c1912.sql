
-- 1) Storage: remove broad SELECT (listing) policies. Public buckets still serve files via direct URL.
DROP POLICY IF EXISTS "Public can read banner files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read channel-logos" ON storage.objects;

-- 2) Lock down EXECUTE on SECURITY DEFINER functions (least privilege).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.add_push_game_id(text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.add_push_game_id(text, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.remove_push_game_id(text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.remove_push_game_id(text, text) TO anon, authenticated;

-- Only callable by edge functions using the service role (which bypasses grants).
REVOKE EXECUTE ON FUNCTION public.remove_multiple_game_ids(text, text[]) FROM PUBLIC, anon, authenticated;

-- Trigger-only functions: no client should call them directly.
REVOKE EXECUTE ON FUNCTION public.log_daily_games_delete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
