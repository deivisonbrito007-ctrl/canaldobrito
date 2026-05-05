import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getLocalDateString } from "@/lib/gameUtils";

/**
 * Returns which tabs have "new" content to badge in BottomNav.
 * - novidades: news_releases added in last 7 days
 * - highlights: featured_movies or featured_series added in last 7 days
 * - schedule: daily_games scheduled for today
 * - live: any daily_games with is_live=true today
 */
export interface TabBadges {
  live: boolean;
  novidades: boolean;
  highlights: boolean;
  schedule: boolean;
}

export const useTabBadges = () => {
  return useQuery<TabBadges>({
    queryKey: ["tab-badges"],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const today = getLocalDateString(new Date());

      const [news, movies, series, games, live] = await Promise.all([
        supabase.from("news_releases").select("id", { count: "exact", head: true }).eq("active", true).gte("created_at", since),
        supabase.from("featured_movies").select("id", { count: "exact", head: true }).eq("active", true).gte("created_at", since),
        supabase.from("featured_series").select("id", { count: "exact", head: true }).eq("active", true).gte("created_at", since),
        supabase.from("daily_games").select("id", { count: "exact", head: true }).eq("date", today).eq("active", true).eq("archived", false),
        supabase.from("daily_games").select("id", { count: "exact", head: true }).eq("date", today).eq("is_live", true),
      ]);

      return {
        live: (live.count ?? 0) > 0,
        novidades: (news.count ?? 0) > 0,
        highlights: (movies.count ?? 0) + (series.count ?? 0) > 0,
        schedule: (games.count ?? 0) > 0,
      };
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
};
