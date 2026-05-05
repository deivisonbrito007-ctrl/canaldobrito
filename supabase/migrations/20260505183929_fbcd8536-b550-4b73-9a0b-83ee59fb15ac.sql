
CREATE OR REPLACE FUNCTION public.log_daily_games_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.audit_logs (action, entity, actor_id, payload)
  VALUES (
    CASE WHEN OLD.source = 'manual' THEN 'delete_manual' ELSE 'delete_api' END,
    'daily_games',
    auth.uid(),
    jsonb_build_object(
      'id', OLD.id,
      'date', OLD.date,
      'home_team', OLD.home_team,
      'away_team', OLD.away_team,
      'game_time', OLD.game_time,
      'sport_type', OLD.sport_type,
      'source', OLD.source,
      'channels', OLD.channels
    )
  );
  RETURN OLD;
END;
$function$;
