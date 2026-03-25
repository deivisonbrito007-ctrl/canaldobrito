import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DailyGame {
  id: string;
  date: string;
  home_team: string;
  away_team: string;
  competition: string;
  competition_detail: string | null;
  game_time: string;
  channels: string[];
  is_live: boolean;
  is_womens: boolean;
  active: boolean;
  archived: boolean;
  status_short: string;
  elapsed_minutes: number | null;
  publish_at: string | null;
  sport_type: string;
  created_at: string;
}

export const useDailyGames = (date: string) =>
  useQuery({
    queryKey: ["daily_games", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_games")
        .select("*")
        .eq("date", date)
        .eq("active", true)
        .eq("archived", false)
        .order("game_time", { ascending: true });
      if (error) throw error;
      return data as DailyGame[];
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

export const useAllDailyGames = (date: string) =>
  useQuery({
    queryKey: ["daily_games", "all", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_games")
        .select("*")
        .eq("date", date)
        .order("game_time", { ascending: true });
      if (error) throw error;
      return data as DailyGame[];
    },
    refetchInterval: 60_000,
  });

export const useInsertDailyGames = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (games: Omit<DailyGame, "id" | "created_at">[]) => {
      const { error } = await supabase.from("daily_games").insert(games as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily_games"] }),
  });
};

export const useUpdateDailyGame = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DailyGame> & { id: string }) => {
      const { error } = await supabase.from("daily_games").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily_games"] }),
  });
};

export const useDeleteDailyGame = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_games").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily_games"] }),
  });
};

export const useDeleteDailyGamesByDate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (date: string) => {
      const { error } = await supabase.from("daily_games").delete().eq("date", date);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily_games"] }),
  });
};
