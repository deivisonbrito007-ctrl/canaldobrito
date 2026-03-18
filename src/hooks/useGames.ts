import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Game, SportType } from "@/types/sports";
import type { Tables } from "@/integrations/supabase/types";

type GameRow = Tables<"games">;

const mapRowToGame = (row: GameRow): Game => ({
  id: row.id,
  sport: row.sport as SportType,
  league: row.league,
  leagueIcon: row.league_icon ?? undefined,
  homeTeam: {
    name: row.home_team_name,
    logo: row.home_team_logo ?? undefined,
    score: row.home_team_score ?? undefined,
  },
  awayTeam: {
    name: row.away_team_name,
    logo: row.away_team_logo ?? undefined,
    score: row.away_team_score ?? undefined,
  },
  startTime: row.start_time,
  status: row.status,
  venue: row.venue ?? undefined,
  round: row.round ?? undefined,
  highlight: row.highlight,
  broadcastChannel: row.broadcast_channel ?? undefined,
});

const sortGames = (games: Game[]): Game[] => {
  const statusOrder: Record<string, number> = { live: 0, scheduled: 1, finished: 2 };
  return [...games].sort((a, b) => {
    const sa = statusOrder[a.status] ?? 1;
    const sb = statusOrder[b.status] ?? 1;
    if (sa !== sb) return sa - sb;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
};

export const useGames = () => {
  return useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const today = new Date();
      const startOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())).toISOString();
      const endOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 1)).toISOString();

      const { data, error } = await supabase
        .from("games")
        .select("*")
        .gte("start_time", startOfDay)
        .lt("start_time", endOfDay)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return sortGames((data || []).map(mapRowToGame));
    },
    refetchInterval: 60_000,
  });
};
