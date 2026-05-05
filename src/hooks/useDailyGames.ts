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

// Sistema 100% manual: somente jogos inseridos via WhatsApp parser são exibidos.

export const useDailyGames = (date: string) => {
  return useQuery({
    queryKey: ["daily_games", date, "manual"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_games")
        .select("*")
        .eq("date", date)
        .eq("active", true)
        .eq("archived", false)
        .eq("source", "manual")
        .order("game_time", { ascending: true });
      if (error) throw error;
      return data as DailyGame[];
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
};

export const useAllDailyGames = (date: string) => {
  return useQuery({
    queryKey: ["daily_games", "all", date, "manual"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_games")
        .select("*")
        .eq("date", date)
        .eq("source", "manual")
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
};

/**
 * Insert daily games with automatic dedup:
 * fetches existing games for the date(s) and skips duplicates.
 */
/** Defensive sanitization: remove broken surrogates from any string */
function sanitizeGameStr(s: string): string {
  return s
    .replace(/[\uD800-\uDFFF]/g, "")
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "")
    .replace(/[\u{1F3F4}\u{E0067}-\u{E007F}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const DAILY_GAMES_COLUMNS = new Set([
  "date", "home_team", "away_team", "competition", "competition_detail",
  "game_time", "channels", "is_live", "is_womens", "active", "archived",
  "status_short", "elapsed_minutes", "publish_at", "sport_type",
]);

function sanitizeGame(game: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(game)) {
    if (!DAILY_GAMES_COLUMNS.has(key)) continue;
    if (typeof value === "string" && ["home_team","away_team","competition","competition_detail"].includes(key)) {
      out[key] = sanitizeGameStr(value);
    } else {
      out[key] = value;
    }
  }
  if (Array.isArray(out.channels)) {
    out.channels = out.channels.map((c: any) => typeof c === "string" ? sanitizeGameStr(c) : c);
  }
  return out;
}

export const useInsertDailyGames = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (games: Omit<DailyGame, "id" | "created_at">[]) => {
      if (games.length === 0) return { inserted: 0, skipped: 0, intraBatchSkipped: 0 };

      // STEP 1: dedup INSIDE the batch itself (keep first occurrence).
      // Without this, two identical rows in the same payload trigger PG 23505
      // and abort the whole INSERT — which is exactly what failed on 28/04.
      const seen = new Set<string>();
      const intraDeduped: typeof games = [];
      let intraBatchSkipped = 0;
      for (const g of games) {
        const k = gameKey(g) + "|" + g.date;
        if (seen.has(k)) {
          intraBatchSkipped++;
          continue;
        }
        seen.add(k);
        intraDeduped.push(g);
      }

      // STEP 2: dedup against existing rows in DB.
      const dates = [...new Set(intraDeduped.map((g) => g.date))];
      const { data: existing, error: fetchErr } = await supabase
        .from("daily_games")
        .select("home_team, away_team, game_time, date")
        .in("date", dates);
      if (fetchErr) throw fetchErr;

      const existingKeys = new Set(
        (existing || []).map((e: any) => gameKey(e) + "|" + e.date)
      );

      const unique = intraDeduped.filter((g) => !existingKeys.has(gameKey(g) + "|" + g.date));
      const dbSkipped = intraDeduped.length - unique.length;
      const skipped = dbSkipped + intraBatchSkipped;

      if (unique.length > 0) {
        const sanitized = unique.map(sanitizeGame);
        const { error } = await supabase.from("daily_games").insert(sanitized as any);
        if (error) {
          // PG 23505 = unique_violation. Race condition or hidden duplicate.
          // Don't blow up with a cryptic message — surface it gracefully.
          if ((error as any).code === "23505") {
            toast.warning(
              "Alguns jogos já existem com data, horário e times idênticos. Foram ignorados."
            );
            return { inserted: 0, skipped: skipped + unique.length, intraBatchSkipped };
          }
          throw error;
        }
      }

      if (intraBatchSkipped > 0) {
        toast.info(`${intraBatchSkipped} duplicata(s) interna(s) no texto colado ignorada(s)`);
      }
      if (dbSkipped > 0) {
        toast.info(`${dbSkipped} jogo(s) já existente(s) no banco ignorado(s)`);
      }

      return { inserted: unique.length, skipped, intraBatchSkipped };
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
