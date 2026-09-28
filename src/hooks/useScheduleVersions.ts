import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DailyGame } from "@/hooks/useDailyGames";
import type { Json } from "@/integrations/supabase/types";

export type ScheduleVersionAction = "publish" | "republish" | "restore";

export interface SchedulePublicationVersion {
  id: string;
  action: ScheduleVersionAction;
  dates: string[];
  game_count: number;
  games: DailyGame[];
  created_by: string | null;
  created_at: string;
}

export const useScheduleVersions = () =>
  useQuery({
    queryKey: ["schedule_publication_versions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_publication_versions")
        .select("id,action,dates,game_count,games,created_by,created_at")
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...row,
        action: row.action as ScheduleVersionAction,
        games: Array.isArray(row.games) ? (row.games as unknown as DailyGame[]) : [],
      })) as SchedulePublicationVersion[];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

export const useCreateScheduleVersion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ action, games, userId }: { action: Exclude<ScheduleVersionAction, "restore">; games: Record<string, unknown>[]; userId: string }) => {
      const dates = [...new Set(games.map((game) => String(game.date)))].sort();
      const { error } = await supabase.from("schedule_publication_versions").insert({
        action,
        dates,
        game_count: games.length,
        games: games as Json,
        created_by: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule_publication_versions"] }),
  });
};

export const useRestoreScheduleVersion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (versionId: string) => {
      const { data, error } = await supabase.rpc("restore_schedule_publication_version", { _version_id: versionId });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["daily_games"] }),
        qc.invalidateQueries({ queryKey: ["schedule_publication_versions"] }),
      ]);
    },
  });
};
