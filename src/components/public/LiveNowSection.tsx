import { useDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "P"];

function isGameLive(game: DailyGame): boolean {
  if (LIVE_STATUSES.includes(game.status_short)) return true;
  if (game.is_live) return true;
  return false;
}

function getLiveLabel(game: DailyGame): string {
  const s = game.status_short;
  const e = game.elapsed_minutes;
  if (s === "HT") return "INT";
  if (s === "1H" || s === "2H") return e != null ? `${e}'` : "AO VIVO";
  if (s === "ET") return e != null ? `${e}'` : "PROR";
  if (s === "P") return "PÊN";
  return "AO VIVO";
}

// Mock data for when no live games from DB
const mockLiveGames = [
  { id: "mock-1", home_team: "Chelsea (F)", away_team: "Brighton (F)", competition: "Campeonato Inglês Feminino", score: "1 x 1", channels: ["Canal GOAT", "ESPN", "Disney+"], label: "67'" },
  { id: "mock-2", home_team: "Palmeiras", away_team: "Botafogo", competition: "Copa do Brasil", score: "2 x 0", channels: ["Globo", "SporTV"], label: "67'" },
  { id: "mock-3", home_team: "Barcelona", away_team: "Atlético", competition: "La Liga", score: "3 x 1", channels: ["ESPN", "Star+"], label: "82'" },
];

export const LiveNowSection = () => {
  const today = new Date().toISOString().split("T")[0];
  const { data: games } = useDailyGames(today);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const liveGames = useMemo(
    () => (games || []).filter(isGameLive),
    [games]
  );

  const hasRealGames = liveGames.length > 0;
  const displayGames = hasRealGames ? liveGames : null;
  const displayMock = !hasRealGames ? mockLiveGames : null;
  const totalCount = hasRealGames ? liveGames.length : mockLiveGames.length;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">⚽</span>
          <h2 className="font-display text-xl tracking-[2px] text-foreground">
            Jogos Ao Vivo
          </h2>
          <span className="text-[10px] bg-destructive/15 text-destructive rounded-full px-2 py-0.5 font-bold font-body tabular-nums">
            {totalCount}
          </span>
        </div>
        <button className="text-xs text-primary font-semibold font-body">
          Ver todos →
        </button>
      </div>

      {/* Cards */}
      <div className="flex gap-3.5 overflow-x-auto scrollbar-hide px-4 pb-2" style={{ scrollSnapType: "x mandatory" }}>
        {displayGames?.map((game, idx) => {
          const label = getLiveLabel(game);
          const channels = game.channels?.join(" · ");

          return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.3 }}
              className="min-w-[280px] w-[78vw] max-w-[320px] shrink-0"
              style={{ scrollSnapAlign: "start" }}
            >
              <div className="rounded-2xl bg-card border border-border/10 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_hsl(0,84%,60%,0.12)] cursor-pointer">
                {/* Red top border */}
                <div className="h-1 bg-gradient-to-r from-destructive via-destructive/80 to-destructive/40" />

                <div className="p-4 space-y-3 relative">
                  {/* Subtle red radial */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-destructive/5 rounded-full blur-2xl" />

                  {/* Competition */}
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[2px] text-center font-body">
                    🏆 {game.competition}
                  </p>

                  {/* Teams + Score */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 text-center">
                      <p className="text-sm font-bold text-foreground font-body leading-tight">{game.home_team}</p>
                    </div>
                    <div className="shrink-0 px-3 py-1.5 rounded-lg bg-destructive/90 shadow-[0_0_12px_hsl(0,84%,60%,0.3)]">
                      <span className="font-display text-[22px] text-white tracking-wider">vs</span>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-sm font-bold text-foreground font-body leading-tight">{game.away_team}</p>
                    </div>
                  </div>

                  {/* Live indicator */}
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                    </span>
                    <span className="text-xs font-bold text-destructive tabular-nums font-body">
                      ● {label}
                    </span>
                  </div>

                  {/* Channels */}
                  {channels && (
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {game.channels?.map((ch) => (
                        <span key={ch} className="text-[9px] rounded-md border border-border/20 px-2 py-0.5 text-muted-foreground font-body">
                          {ch}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {displayMock?.map((game, idx) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.3 }}
            className="min-w-[280px] w-[78vw] max-w-[320px] shrink-0"
            style={{ scrollSnapAlign: "start" }}
          >
            <div className="rounded-2xl bg-card border border-border/10 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_hsl(0,84%,60%,0.12)] cursor-pointer">
              <div className="h-1 bg-gradient-to-r from-destructive via-destructive/80 to-destructive/40" />
              <div className="p-4 space-y-3 relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-destructive/5 rounded-full blur-2xl" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[2px] text-center font-body">
                  🏆 {game.competition}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 text-center">
                    <p className="text-sm font-bold text-foreground font-body leading-tight">{game.home_team}</p>
                  </div>
                  <div className="shrink-0 px-3 py-1.5 rounded-lg bg-destructive/90 shadow-[0_0_12px_hsl(0,84%,60%,0.3)]">
                    <span className="font-display text-[22px] text-white tracking-wider">{game.score}</span>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-sm font-bold text-foreground font-body leading-tight">{game.away_team}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                  </span>
                  <span className="text-xs font-bold text-destructive tabular-nums font-body">
                    ● {game.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {game.channels.map((ch) => (
                    <span key={ch} className="text-[9px] rounded-md border border-border/20 px-2 py-0.5 text-muted-foreground font-body">
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
