import { useDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";

const HIGHLIGHT_COMPS = [
  "champions league",
  "brasileirão",
  "brasileirao",
  "libertadores",
  "copa do brasil",
  "premier league",
  "la liga",
];

function isGameLive(game: DailyGame): boolean {
  if (game.is_live) return true;
  const now = new Date();
  const [h, m] = (game.game_time || "00:00").split(":").map(Number);
  const gameStart = new Date();
  gameStart.setHours(h, m, 0, 0);
  const gameEnd = new Date(gameStart.getTime() + 2 * 60 * 60 * 1000);
  return now >= gameStart && now <= gameEnd;
}

function getLiveMinute(gameTime: string): string {
  const now = new Date();
  const [h, m] = gameTime.split(":").map(Number);
  const gameStart = new Date();
  gameStart.setHours(h, m, 0, 0);
  const elapsed = Math.floor((now.getTime() - gameStart.getTime()) / 60000);
  if (elapsed < 0) return "";
  if (elapsed <= 45) return `${elapsed}'`;
  if (elapsed <= 60) return "Intervalo";
  if (elapsed <= 105) return `${elapsed - 15}'`;
  return "Final";
}

function isHighlight(competition: string): boolean {
  const key = competition.toLowerCase().trim();
  return HIGHLIGHT_COMPS.some((c) => key.includes(c));
}

const COMP_COLORS: Record<string, string> = {
  "champions league": "bg-blue-800/80",
  "brasileirão": "bg-emerald-500/80",
  "brasileirao": "bg-emerald-500/80",
  "libertadores": "bg-amber-500/80",
  "copa do brasil": "bg-yellow-500/80",
  "premier league": "bg-purple-700/80",
  "la liga": "bg-orange-600/80",
};

function getCompColor(comp: string) {
  const key = comp.toLowerCase().trim();
  for (const [k, v] of Object.entries(COMP_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-muted";
}

export const LiveNowSection = () => {
  const today = new Date().toISOString().split("T")[0];
  const { data: games } = useDailyGames(today);
  const [, setTick] = useState(0);

  // Re-render every 30s for live minute updates
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const liveGames = useMemo(
    () => (games || []).filter(isGameLive),
    [games]
  );

  if (liveGames.length === 0) return null;

  return (
    <section className="space-y-4 px-4 sm:px-6">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
        </span>
        <h2 className="font-display text-lg font-bold text-foreground">
          Ao Vivo Agora
        </h2>
        <span className="text-[10px] bg-destructive/20 text-destructive rounded-full px-2 py-0.5 font-bold">
          {liveGames.length}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
        {liveGames.map((game, idx) => {
          const minute = getLiveMinute(game.game_time || "00:00");
          const highlight = isHighlight(game.competition);

          return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.06, duration: 0.3 }}
              className="min-w-[260px] flex-shrink-0"
            >
              <div
                className={`rounded-2xl glass-card p-4 border-2 animate-border-pulse-live transition-all ${
                  highlight ? "glow-live" : ""
                }`}
              >
                {/* Top: competition + live badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold text-primary-foreground px-2 py-0.5 rounded-lg ${getCompColor(game.competition)}`}
                    >
                      {game.competition}
                    </span>
                    {highlight && (
                      <Flame className="h-3.5 w-3.5 text-amber-400" />
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-destructive animate-pulse-live">
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                    AO VIVO
                  </span>
                </div>

                {/* Teams */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-foreground flex-1 text-left truncate">
                    {game.home_team}
                  </p>
                  <span className="text-base font-bold text-destructive tabular-nums shrink-0">
                    {minute}
                  </span>
                  <p className="text-sm font-bold text-foreground flex-1 text-right truncate">
                    {game.away_team}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 mt-3">
                  {game.is_womens && (
                    <span className="text-[10px] bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-lg font-bold">
                      ♀ Feminino
                    </span>
                  )}
                  {game.competition_detail && (
                    <span className="text-[10px] text-muted-foreground">
                      {game.competition_detail}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
