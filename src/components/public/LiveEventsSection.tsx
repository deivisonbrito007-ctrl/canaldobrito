import { useDailyGames } from "@/hooks/useDailyGames";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { isGameCurrentlyLive, getLocalDateString, getElapsedMinutes, SPORT_EMOJI, isNonAdversarial, type SportType } from "@/lib/gameUtils";
import { Flag, Clock } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { ChannelBadge } from "./ChannelBadge";

export const LiveEventsSection = () => {
  const [today, setToday] = useState(() => getLocalDateString());
  const { data: games } = useDailyGames(today);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setToday(getLocalDateString());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const liveEvents = useMemo(() => {
    return (games || []).filter((g) => {
      const st = (g.sport_type || 'football') as SportType;
      return isNonAdversarial(st) && isGameCurrentlyLive(g.game_time, g.date, st);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games, Math.floor(Date.now() / 60000)]);

  if (liveEvents.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="px-4">
        <SectionHeader
          icon={Flag}
          title="Eventos Ao Vivo"
          subtitle="Corridas e eventos em tempo real"
          badge={
            <span className="text-[10px] bg-amber-500/15 text-amber-500 rounded-full px-2 py-0.5 font-bold font-body tabular-nums animate-pulse">
              {liveEvents.length} ao vivo
            </span>
          }
        />
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2 snap-x snap-mandatory">
        {liveEvents.map((event, idx) => {
          const sportType = (event.sport_type || 'f1') as SportType;
          const elapsed = getElapsedMinutes(event.game_time, event.date, sportType);
          const emoji = SPORT_EMOJI[sportType] || '🏁';

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.3 }}
              className="min-w-[260px] w-[75vw] max-w-[300px] shrink-0 snap-start"
            >
              <div className="rounded-2xl bg-card border border-amber-500/20 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_hsl(38,92%,50%,0.15)]">
                {/* Accent bar */}
                <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-500/60 to-transparent" />

                <div className="p-3.5 space-y-2.5 relative">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-2xl" />

                  {/* Competition + Live indicator */}
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider truncate max-w-[55%] font-body">
                      {emoji} {event.competition}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-60" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                      </span>
                      <span className="text-[10px] font-bold text-amber-500 tabular-nums font-body">
                        {elapsed !== null ? `${elapsed}'` : "AO VIVO"}
                      </span>
                    </div>
                  </div>

                  {/* Event name — centered */}
                  <div className="text-center">
                    <p className="text-[14px] font-bold text-foreground leading-tight font-body">
                      {event.home_team}
                      {event.away_team && event.away_team !== event.home_team && ` — ${event.away_team}`}
                    </p>
                  </div>

                  {/* Time + Channels */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-muted-foreground/60">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px] font-medium tabular-nums font-body">
                        {event.game_time?.slice(0, 5)}
                      </span>
                    </div>
                    {event.channels && event.channels.length > 0 && (
                      <div className="flex gap-1 flex-wrap justify-end">
                        {event.channels.slice(0, 2).map((ch) => (
                          <ChannelBadge key={ch} name={ch} />
                        ))}
                        {event.channels.length > 2 && (
                          <span className="text-[9px] text-muted-foreground/50 self-center">+{event.channels.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
