
-- Revoke default public EXECUTE on SECURITY DEFINER functions and grant only to needed roles

-- Trigger functions: no direct execution needed
REVOKE EXECUTE ON FUNCTION public.log_daily_games_delete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_settings_secret_flag() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- has_role: used inside RLS (definer bypasses anyway); no need for anon direct call
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Admin-only function
REVOKE EXECUTE ON FUNCTION public.reorder_channel_mappings(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reorder_channel_mappings(uuid[]) TO authenticated;

-- Alias collision check: admin UI usage only
REVOKE EXECUTE ON FUNCTION public.check_alias_collision(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_alias_collision(text, uuid) TO authenticated;

-- Push subscription RPCs: anonymous push is intentional (RFC 8291), keep anon+authenticated
REVOKE EXECUTE ON FUNCTION public.upsert_push_subscription(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_push_subscription(text, text, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.add_push_game_id(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_push_game_id(text, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.remove_push_game_id(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_push_game_id(text, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.remove_multiple_game_ids(text, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_multiple_game_ids(text, text[]) TO anon, authenticated;
