import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { callSportsApi, type SportsApiStatus, type SportsApiSuggestion, type SportsApiSyncRun } from "@/lib/sportsApi";

export const SPORTSAPI_SUGGESTIONS_QK = ["sportsapi_suggestions"] as const;
export const SPORTSAPI_RUNS_QK = ["sportsapi_sync_runs"] as const;

export function useSportsApiSuggestions(date: string) {
  return useQuery({
    queryKey: [...SPORTSAPI_SUGGESTIONS_QK, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sportsapi_suggestions")
        .select("*")
        .eq("date", date)
        .order("game_time", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SportsApiSuggestion[];
    },
    staleTime: 30_000,
  });
}

export function useSportsApiRuns(limit = 10) {
  return useQuery({
    queryKey: [...SPORTSAPI_RUNS_QK, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sportsapi_sync_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as SportsApiSyncRun[];
    },
    staleTime: 30_000,
  });
}

export function useSportsApiSports() {
  return useQuery({
    queryKey: ["sportsapi_sports"],
    queryFn: () => callSportsApi<{ sports: { id: string; name: string }[] }>({ action: "sports" }),
    staleTime: 24 * 3600_000,
    retry: false,
  });
}

/** Contagem de jogos vinculados por canal (nome normalizado) e último uso. */
export function useSportsApiChannelUsage() {
  return useQuery({
    queryKey: ["sportsapi_channel_usage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_games")
        .select("channels,date")
        .eq("source", "sportsapi")
        .order("date", { ascending: false })
        .limit(2000);
      if (error) throw error;
      const usage = new Map<string, { count: number; lastDate: string }>();
      for (const g of data ?? []) {
        for (const c of (g.channels ?? []) as string[]) {
          const k = c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
          const cur = usage.get(k);
          if (cur) cur.count++;
          else usage.set(k, { count: 1, lastDate: g.date as string });
        }
      }
      return usage;
    },
    staleTime: 5 * 60_000,
  });
}

const useInvalidate = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: SPORTSAPI_SUGGESTIONS_QK });
    qc.invalidateQueries({ queryKey: SPORTSAPI_RUNS_QK });
    qc.invalidateQueries({ queryKey: ["daily_games"] });
    qc.invalidateQueries({ queryKey: ["sportsapi_channel_usage"] });
    qc.invalidateQueries({ queryKey: ["sportsapi_status"] });
  };
};

export function useSportsApiFetch() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { date: string; sports?: string[] }) =>
      callSportsApi<{ totals: Record<string, number>; errors: string[]; sports: string[] }>({ action: "fetch", ...v }),
    onSettled: inv,
  });
}

export function useSportsApiLive() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: () => callSportsApi<{ updated: number; checked?: number; skipped?: boolean }>({ action: "live" }),
    onSettled: inv,
  });
}

export function useSportsApiImport() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { ids: string[]; active?: boolean }) =>
      callSportsApi<{ results: { id: string; ok: boolean; reason?: string }[] }>({ action: "import", ...v }),
    onSettled: inv,
  });
}

export function useSportsApiIgnore() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (ids: string[]) => callSportsApi<{ ignored: number }>({ action: "ignore", ids }),
    onSettled: inv,
  });
}

export function useSportsApiUpdateExisting() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => callSportsApi<{ game_id: string }>({ action: "update-existing", id }),
    onSettled: inv,
  });
}

export function useSportsApiStatus() {
  return useQuery({
    queryKey: ["sportsapi_status"],
    queryFn: () => callSportsApi<SportsApiStatus>({ action: "status" }),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: false,
  });
}

export function useSportsApiTest() {
  return useMutation({
    mutationFn: () => callSportsApi<{ ok: boolean; latencyMs?: number; message?: string; sports?: number | null }>({ action: "test" }),
  });
}

export function useSportsApiAutoFetch() {
  const inv = useInvalidate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => callSportsApi<{ skipped: boolean; reason?: string; dates?: Record<string, unknown> }>({ action: "auto-fetch" }),
    onSettled: () => { inv(); qc.invalidateQueries({ queryKey: ["sportsapi_status"] }); },
  });
}
