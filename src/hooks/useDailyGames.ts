import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { gameKey } from "@/lib/dedup";
import { toast } from "sonner";

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

      // Auto-cleanup: detect and remove duplicates, keeping oldest
      const rows = data as DailyGame[];
      const seen = new Map<string, DailyGame>();
      const dupeIds: string[] = [];

      for (const row of rows) {
        const key = gameKey(row);
        const existing = seen.get(key);
        if (existing) {
          // Keep older record (smaller created_at)
          if (row.created_at < existing.created_at) {
            dupeIds.push(existing.id);
            seen.set(key, row);
          } else {
            dupeIds.push(row.id);
          }
        } else {
          seen.set(key, row);
        }
      }

      if (dupeIds.length > 0) {
        await supabase.from("daily_games").delete().in("id", dupeIds);
        toast.info(`${dupeIds.length} duplicata(s) removida(s) automaticamente`);
        return rows.filter((r) => !dupeIds.includes(r.id));
      }

      return rows;
    },
    refetchInterval: 60_000,
  });

/**
 * Insert daily games with automatic dedup:
 * fetches existing games for the date(s) and skips duplicates.
 */
export const useInsertDailyGames = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (games: Omit<DailyGame, "id" | "created_at">[]) => {
      if (games.length === 0) return { inserted: 0, skipped: 0 };

      // Collect unique dates
      const dates = [...new Set(games.map((g) => g.date))];

      // Fetch existing games for those dates
      const { data: existing, error: fetchErr } = await supabase
        .from("daily_games")
        .select("home_team, away_team, game_time")
        .in("date", dates);
      if (fetchErr) throw fetchErr;

      const existingKeys = new Set(
        (existing || []).map((e: any) => gameKey(e))
      );

      const unique = games.filter((g) => !existingKeys.has(gameKey(g)));
      const skipped = games.length - unique.length;

      if (unique.length > 0) {
        const { error } = await supabase.from("daily_games").insert(unique as any);
        if (error) throw error;
      }

      if (skipped > 0) {
        toast.info(`${skipped} jogo(s) duplicado(s) ignorado(s)`);
      }

      return { inserted: unique.length, skipped };
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

export const useArchivedDailyGames = () =>
  useQuery({
    queryKey: ["daily_games", "archived"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_games")
        .select("*")
        .eq("archived", true)
        .order("date", { ascending: false })
        .order("game_time", { ascending: true });
      if (error) throw error;
      return data as DailyGame[];
    },
    refetchInterval: 60_000,
  });

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

/**
 * Fetch existing game keys for a date (used by ProgramacaoTexto for visual dedup).
 */
export async function fetchExistingGameKeys(date: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("daily_games")
    .select("home_team, away_team, game_time")
    .eq("date", date);
  return new Set((data || []).map((g: any) => gameKey(g)));
}
