import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Zap } from "lucide-react";
import { type DailyGame } from "@/hooks/useDailyGames";
import { getMinutesUntilStart, formatCountdown, isGameCurrentlyLive, isNonAdversarial, SPORT_EMOJI, type SportType } from "@/lib/gameUtils";
import { ChannelBadge } from "./ChannelBadge";

const COMP_GRADIENTS: Record<string, string> = {
  "brasileirão": "from-emerald-600/30 to-emerald-900/20",
  "brasileirao": "from-emerald-600/30 to-emerald-900/20",
  "campeonato brasileiro": "from-emerald-600/30 to-emerald-900/20",
  "champions league": "from-blue-600/30 to-blue-900/20",
  "libertadores": "from-amber-600/30 to-amber-900/20",
  "copa do brasil": "from-yellow-600/30 to-yellow-900/20",
  "premier league": "from-purple-700/30 to-purple-900/20",
};

function getHeroGradient(comp: string): string {
  const key = comp.toLowerCase().trim();
  for (const [k, v] of Object.entries(COMP_GRADIENTS)) {
    if (key.includes(k)) return v;
  }
  return "from-primary/20 to-primary/5";
}

interface NextGameHeroProps {
  games: DailyGame[];
}

export const NextGameHero = ({ games }: NextGameHeroProps) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const nextGame = useMemo(() => {
    const upcoming = games.filter((g) => {
      const live = isGameCurrentlyLive(g.game_time, g.date, (g.sport_type || 'football') as SportType);
      const mins = getMinutesUntilStart(g.game_time, g.date);
      return !live && mins !== null && mins > 0;
    });
    if (upcoming.length === 0) return null;
    return upcoming[0]; // already sorted by game_time
  }, [games]);

  if (!nextGame) return null;

  const sportType = (nextGame.sport_type || 'football') as SportType;
  const emoji = SPORT_EMOJI[sportType] || '⚽';
  const nonAdversarial = isNonAdversarial(sportType);
  const mins = getMinutesUntilStart(nextGame.game_time, nextGame.date);
  const countdown = mins ? formatCountdown(mins) : "";
  const gradient = getHeroGradient(nextGame.competition);
  const isSoon = mins !== null && mins <= 30;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className={`relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br ${gradient} backdrop-blur-xl`}>
        {/* Top accent */}
        <div className="h-[3px] bg-gradient-to-r from-primary via-primary/60 to-transparent" />

        <div className="p-4 sm:p-5 space-y-3">
          {/* Label */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {nonAdversarial ? "Próximo evento" : "Próximo jogo"}
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              {emoji} {nextGame.competition}
            </span>
          </div>

          {/* Teams / Event */}
          {nonAdversarial ? (
            <div className="flex items-center gap-3">
              <p className="text-base sm:text-lg font-bold text-foreground flex-1 text-center">
                {nextGame.home_team}
                {nextGame.away_team && nextGame.away_team !== nextGame.home_team && ` — ${nextGame.away_team}`}
              </p>
              <div className="flex flex-col items-center shrink-0">
                <div className={`flex items-center gap-1.5 rounded-xl px-4 py-2 border ${
                  isSoon
                    ? "bg-warning/15 border-warning/30"
                    : "bg-primary/10 border-primary/20"
                }`}>
                  <Clock className={`h-4 w-4 ${isSoon ? "text-warning animate-pulse" : "text-primary"}`} />
                  <span className={`text-base font-bold tabular-nums tracking-wide ${
                    isSoon ? "text-warning" : "text-primary"
                  }`}>
                    {nextGame.game_time?.slice(0, 5)}
                  </span>
                </div>
                {countdown && (
                  <span className={`text-[10px] font-bold mt-1 tabular-nums ${
                    isSoon ? "text-warning animate-pulse" : "text-muted-foreground/60"
                  }`}>
                    em {countdown}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-base sm:text-lg font-bold text-foreground flex-1 text-left truncate">
                {nextGame.home_team}
              </p>
              <div className="flex flex-col items-center shrink-0">
                <div className={`flex items-center gap-1.5 rounded-xl px-4 py-2 border ${
                  isSoon
                    ? "bg-warning/15 border-warning/30"
                    : "bg-primary/10 border-primary/20"
                }`}>
                  <Clock className={`h-4 w-4 ${isSoon ? "text-warning animate-pulse" : "text-primary"}`} />
                  <span className={`text-base font-bold tabular-nums tracking-wide ${
                    isSoon ? "text-warning" : "text-primary"
                  }`}>
                    {nextGame.game_time?.slice(0, 5)}
                  </span>
                </div>
                {countdown && (
                  <span className={`text-[10px] font-bold mt-1 tabular-nums ${
                    isSoon ? "text-warning animate-pulse" : "text-muted-foreground/60"
                  }`}>
                    em {countdown}
                  </span>
                )}
              </div>
              <p className="text-base sm:text-lg font-bold text-foreground flex-1 text-right truncate">
                {nextGame.away_team}
              </p>
            </div>
          )}

          {/* Channels */}
          {nextGame.channels && nextGame.channels.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {nextGame.channels.slice(0, 4).map((ch, i) => (
                <ChannelBadge key={i} name={ch} />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
