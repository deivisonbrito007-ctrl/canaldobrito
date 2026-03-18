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

  // Fallback for is_live without status_short
  return "AO VIVO";
}

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

  return (
    <section id="esportes" className="space-y-5 px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-50" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
        </span>
        <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
          Jogos Ao Vivo
        </h2>
        {liveGames.length > 0 && (
          <span className="text-[11px] bg-destructive/15 text-destructive rounded-full px-2.5 py-0.5 font-bold tabular-nums">
            {liveGames.length}
          </span>
        )}
      </div>

      {liveGames.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border/10 p-10 text-center">
          <p className="text-sm text-muted-foreground/60">
            Nenhum jogo ao vivo no momento
          </p>
        </div>
      ) : (
        <div
          className="flex gap-3.5 overflow-x-auto pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 scrollbar-hide"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {liveGames.map((game, idx) => {
            const label = getLiveLabel(game);
            const channels = game.channels?.join(" · ");

            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.3 }}
                className="min-w-[260px] w-[72vw] max-w-[300px] flex-shrink-0"
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="rounded-2xl bg-card border border-border/10 p-5 space-y-4 glow-primary-subtle transition-shadow duration-300 hover:shadow-[0_0_30px_hsl(142,60%,45%,0.1)]">
                  {/* Competition */}
                  <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider text-center">
                    🏆 {game.competition}
                  </p>

                  {/* Teams */}
                  <div className="text-center space-y-1.5">
                    <p className="text-base sm:text-lg font-bold text-foreground leading-snug">
                      {game.home_team}
                    </p>
                    <span className="text-[11px] text-muted-foreground/40 font-medium">vs</span>
                    <p className="text-base sm:text-lg font-bold text-foreground leading-snug">
                      {game.away_team}
                    </p>
                  </div>

                  {/* Live indicator */}
                  <div className="flex items-center justify-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-60" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
                    </span>
                    <span className="text-sm font-extrabold text-destructive tabular-nums tracking-wide">
                      {label}
                    </span>
                  </div>

                  {/* Channels */}
                  {channels && (
                    <p className="text-[11px] text-center text-primary/80 font-semibold tracking-wide">
                      📺 {channels}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
};
