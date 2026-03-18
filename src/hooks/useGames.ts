import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface Game {
  id: string;
  date: string;
  time: string;
  home_team: string;
  away_team: string;
  home_logo: string | null;
  away_logo: string | null;
  competition: string;
  channel: string | null;
  active: boolean;
  created_at: string;
}

export type GameInsert = Omit<Game, "id" | "created_at">;

export const useTodayGames = () => {
  const today = format(new Date(), "yyyy-MM-dd");
  return useQuery({
    queryKey: ["games", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("date", today)
        .eq("active", true)
        .order("time", { ascending: true });
      if (error) throw error;
      return data as Game[];
    },
  });
};

export const useGamesByDate = (date: string) => {
  return useQuery({
    queryKey: ["games", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("date", date)
        .order("time", { ascending: true });
      if (error) throw error;
      return data as Game[];
    },
  });
};

export const useCreateGame = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (game: GameInsert) => {
      const { error } = await supabase.from("games").insert(game);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["games"] }),
  });
};

export const useUpdateGame = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Game> & { id: string }) => {
      const { error } = await supabase.from("games").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["games"] }),
  });
};

export const useDeleteGame = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("games").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["games"] }),
  });
};

export const useClearDayGames = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (date: string) => {
      const { error } = await supabase.from("games").delete().eq("date", date);
      if (error) throw error;
      // Also deactivate daily banner
      await supabase.from("daily_banner").update({ active: false }).eq("date", date);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["games"] });
      qc.invalidateQueries({ queryKey: ["daily_banner"] });
    },
  });
};
