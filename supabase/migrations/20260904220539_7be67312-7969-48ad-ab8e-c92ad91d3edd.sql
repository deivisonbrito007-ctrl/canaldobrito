-- Funções de trigger não devem ser chamáveis pela API
REVOKE ALL ON FUNCTION public.log_content_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_daily_games_delete() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_settings_secret_flag() FROM PUBLIC, anon, authenticated;

-- Funções administrativas: apenas usuários logados (e checam admin internamente)
REVOKE ALL ON FUNCTION public.merge_channel_mappings(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reorder_channel_mappings(uuid[]) FROM PUBLIC, anon;

-- Push anônimo (intencional): mantém acesso, mas restringe a anon/authenticated explícitos
REVOKE ALL ON FUNCTION public.upsert_push_subscription(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_push_game_id(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.remove_push_game_id(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.remove_multiple_game_ids(text, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_push_subscription(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_push_game_id(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.remove_push_game_id(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.remove_multiple_game_ids(text, text[]) TO anon, authenticated;