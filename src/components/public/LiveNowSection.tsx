import { useDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { isGameCurrentlyLive } from "@/lib/gameUtils";

export const LiveNowSection = () => {
  const today = new Date().toISOString().split("T")[0];
  const { data: games } = useDailyGames(today);
  const [, setTick] = useState(0);

  // Re-evaluate every 60s so games enter/exit automatically
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const liveGames = useMemo(
    () => (games || []).filter((g) => isGameCurrentlyLive(g.game_time, g.date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [games, Math.floor(Date.now() / 60000)] // re-filter every minute via tick
  );

  if (liveGames.length === 0) return null;

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
            {liveGames.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex gap-3.5 overflow-x-auto scrollbar-hide px-4 pb-2" style={{ scrollSnapType: "x mandatory" }}>
        {liveGames.map((game, idx) => (
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
                <div className="absolute top-0 right-0 w-20 h-20 bg-destructive/5 rounded-full blur-2xl" />

                {/* Competition */}
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[2px] text-center font-body">
                  🏆 {game.competition}
                </p>

                {/* Teams */}
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
                    ● AO VIVO
                  </span>
                </div>

                {/* Channels */}
                {game.channels && game.channels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {game.channels.map((ch) => (
                      <span key={ch} className="text-[9px] rounded-md border border-border/20 px-2 py-0.5 text-muted-foreground font-body">
                        {ch}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
