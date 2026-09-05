REVOKE EXECUTE ON FUNCTION public.log_content_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_daily_games_delete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_settings_secret_flag() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.merge_channel_mappings(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reorder_channel_mappings(uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_alias_collision(text, uuid) FROM PUBLIC, anon;