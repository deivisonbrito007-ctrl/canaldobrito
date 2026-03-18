import { useDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

function isGameLive(game: DailyGame): boolean {
  if (game.is_live) return true;
  const now = new Date();
  const [h, m] = (game.game_time || "00:00").split(":").map(Number);
  const gameStart = new Date();
  gameStart.setHours(h, m, 0, 0);
  const gameEnd = new Date(gameStart.getTime() + 150 * 60 * 1000);
  return now >= gameStart && now <= gameEnd;
}

function getLiveLabel(gameTime: string): string {
  const now = new Date();
  const [h, m] = gameTime.split(":").map(Number);
  const gameStart = new Date();
  gameStart.setHours(h, m, 0, 0);
  const elapsed = Math.floor((now.getTime() - gameStart.getTime()) / 60000);

  if (elapsed < 0) return "PRÉ";
  if (elapsed <= 45) return `${elapsed}'`;
  if (elapsed <= 60) return "INT";
  if (elapsed <= 105) return `${elapsed - 15}'`;
  if (elapsed <= 135) return "PROR";
  return "PÊN";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [games]
  );

  return (
    <section id="esportes" className="space-y-4 px-3 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="text-base">🔴</span>
        <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
          Jogos Ao Vivo
        </h2>
        {liveGames.length > 0 && (
          <span className="text-[11px] bg-destructive/15 text-destructive rounded-full px-2.5 py-0.5 font-bold tabular-nums">
            {liveGames.length}
          </span>
        )}
      </div>

      {liveGames.length === 0 ? (
        <div className="rounded-2xl bg-[hsl(0,0%,10%)] p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum jogo ao vivo no momento
          </p>
        </div>
      ) : (
        <div
          className="flex gap-3 overflow-x-auto pb-3 -mx-3 px-3 sm:-mx-6 sm:px-6"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {liveGames.map((game, idx) => {
            const label = getLiveLabel(game.game_time || "00:00");
            const channels = game.channels?.join(" · ");

            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.25 }}
                className="min-w-[260px] w-[75vw] max-w-[300px] flex-shrink-0"
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="rounded-2xl bg-[hsl(0,0%,10%)] p-5 shadow-lg space-y-4">
                  {/* Competition */}
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    🏆 {game.competition}
                  </p>

                  {/* Teams */}
                  <div className="text-center space-y-1">
                    <p className="text-[15px] sm:text-base font-bold text-foreground leading-snug">
                      {game.home_team}
                    </p>
                    <span className="text-[11px] text-muted-foreground font-medium">vs</span>
                    <p className="text-[15px] sm:text-base font-bold text-foreground leading-snug">
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
                    <p className="text-[11px] text-center text-muted-foreground/80 font-medium">
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
