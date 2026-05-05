import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to realtime changes on `daily_games` and invalidates the
 * react-query cache so the UI refreshes instantly when admins add/edit/remove
 * games — no manual reload needed.
 */
export const useRealtimeDailyGames = () => {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("daily_games_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_games" },
        () => {
          qc.invalidateQueries({ queryKey: ["daily_games"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
};
