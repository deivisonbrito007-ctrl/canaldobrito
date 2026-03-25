import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import {
  isGameCurrentlyLive,
  getLocalDateString,
  getElapsedMinutes,
  SPORT_EMOJI,
  isNonAdversarial,
  type SportType,
} from "@/lib/gameUtils";
import { ChannelBadge } from "./ChannelBadge";

/* ── Framer-motion variants ── */
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 28, mass: 0.8 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30, mass: 0.9 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

/* ── Sport accent colors (left bar) ── */
const SPORT_ACCENT: Record<string, string> = {
  football: "bg-destructive",
  basketball: "bg-blue-500",
  volleyball: "bg-purple-500",
  tennis: "bg-emerald-500",
  f1: "bg-amber-500",
  mma: "bg-orange-500",
};

/* ── Match card (adversarial) ── */
const MatchCard = React.forwardRef<HTMLDivElement, { game: DailyGame }>(
  ({ game }, ref) => {
    const sportType = (game.sport_type || "football") as SportType;
    const elapsed = getElapsedMinutes(game.game_time, game.date, sportType);
    const emoji = SPORT_EMOJI[sportType] || "⚽";
    const channel = game.channels?.[0];
    const accent = SPORT_ACCENT[game.sport_type] || "bg-destructive";
    const league = [game.competition, game.competition_detail].filter(Boolean).join(" · ");

    return (
      <div
        ref={ref}
        className="min-w-[280px] sm:min-w-[300px] snap-start shrink-0 rounded-2xl overflow-hidden bg-surface-2 border border-border/60 transition-colors duration-300 hover:border-destructive/30"
      >
        <div className="flex">
          <div className={`w-[3px] ${accent}`} />
          <div className="flex-1 min-w-0">
            <div className="px-3 pt-2.5 pb-1.5 flex items-center justify-between gap-2">
              <p className="text-[9px] font-bold uppercase tracking-wider truncate text-muted-foreground font-body">
                {emoji} {league}
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-destructive animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                </span>
                <span className="text-[10px] font-bold text-destructive tabular-nums font-body">
                  {elapsed !== null ? `${elapsed}'` : "AO VIVO"}
                </span>
              </div>
            </div>
            <div className="px-3 pb-2 space-y-1">
              <div className="flex items-center gap-2">
                <p className="flex-1 min-w-0 text-[15px] font-bold text-foreground leading-tight font-body truncate">
                  {game.home_team}
                </p>
                <span className="text-[9px] text-muted-foreground font-body shrink-0 px-1.5 py-0.5 rounded bg-surface border border-border">
                  VS
                </span>
                <p className="flex-1 min-w-0 text-[15px] font-bold text-foreground leading-tight font-body truncate text-right">
                  {game.away_team}
                </p>
              </div>
              {game.is_womens && (
                <p className="text-[9px] text-muted-foreground font-body text-center">Feminino</p>
              )}
            </div>
            <div className="px-3 py-2 flex items-center justify-between gap-2 border-t border-border/40">
              <span className="text-[9px] text-muted-foreground font-body tabular-nums">
                Começou {game.game_time?.slice(0, 5)}
              </span>
              {channel && <ChannelBadge name={channel} />}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
MatchCard.displayName = "MatchCard";

const MotionMatchCard = motion.create(MatchCard);

/* ── Event card (non-adversarial) ── */
const EventCard = React.forwardRef<HTMLDivElement, { event: DailyGame }>(
  ({ event }, ref) => {
    const sportType = (event.sport_type || "f1") as SportType;
    const elapsed = getElapsedMinutes(event.game_time, event.date, sportType);
    const emoji = SPORT_EMOJI[sportType] || "🏁";
    const channel = event.channels?.[0];
    const accent = SPORT_ACCENT[event.sport_type] || "bg-amber-500";

    return (
      <div
        ref={ref}
        className="rounded-xl overflow-hidden bg-surface-2 border border-border/60 transition-colors duration-200 hover:border-amber-500/30"
      >
        <div className="flex">
          <div className={`w-[3px] ${accent}`} />
          <div className="flex-1 min-w-0 p-2.5 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider truncate font-body">
                {emoji} {event.competition}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                </span>
                <span className="text-[9px] font-bold text-amber-500 tabular-nums font-body">
                  {elapsed !== null ? `${elapsed}'` : "AO VIVO"}
                </span>
              </div>
            </div>
            <p className="text-[13px] font-bold text-foreground leading-tight font-body line-clamp-1">
              {event.home_team}
            </p>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9px] text-muted-foreground font-body tabular-nums">
                {event.game_time?.slice(0, 5)}
              </span>
              {channel && <ChannelBadge name={channel} />}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
EventCard.displayName = "EventCard";

const MotionEventCard = motion.create(EventCard);
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] text-muted-foreground font-body tabular-nums">
              {event.game_time?.slice(0, 5)}
            </span>
            {channel && <ChannelBadge name={channel} />}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Clock display ── */
const LiveClock = () => {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  });

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }));
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="text-[10px] text-muted-foreground font-body tabular-nums">{time}</span>
  );
};

/* ── Main component ── */
export const LiveNowHero = () => {
  const [today, setToday] = useState(() => getLocalDateString());
  const { data: games, isLoading } = useDailyGames(today);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setToday(getLocalDateString());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const { matches, events } = useMemo(() => {
    const all = games || [];
    const m: DailyGame[] = [];
    const e: DailyGame[] = [];
    for (const g of all) {
      const st = (g.sport_type || "football") as SportType;
      if (!isGameCurrentlyLive(g.game_time, g.date, st)) continue;
      if (isNonAdversarial(st)) e.push(g);
      else m.push(g);
    }
    return { matches: m, events: e };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games, Math.floor(Date.now() / 60_000)]);

  const totalLive = matches.length + events.length;

  if (!isLoading && totalLive === 0) return null;

  if (isLoading) {
    return (
      <section className="mx-4 rounded-2xl bg-surface-2 border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full skeleton-shimmer" />
          <div className="h-4 w-32 rounded skeleton-shimmer" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[0, 1].map((i) => (
            <div key={i} className="min-w-[280px] h-[110px] rounded-2xl skeleton-shimmer" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-4 rounded-2xl overflow-hidden relative animate-fade-in">
      {/* Pulsing red border glow */}
      <div className="absolute inset-0 rounded-2xl border border-destructive/30 animate-pulse pointer-events-none z-10" />
      
      {/* Background */}
      <div className="bg-gradient-to-br from-destructive/[0.06] via-surface-2 to-surface-2 rounded-2xl p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-destructive animate-ping" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
            </span>
            <h3 className="text-sm font-black text-foreground font-body tracking-tight uppercase">
              Ao Vivo Agora
            </h3>
            <span className="text-[10px] bg-destructive/15 text-destructive rounded-full px-2 py-0.5 font-bold font-body tabular-nums shrink-0">
              {totalLive} {totalLive === 1 ? "jogo" : "jogos"}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LiveClock />
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("nav-tab-change", { detail: "schedule" }));
              }}
              className="text-[10px] text-primary font-semibold font-body hover:underline min-h-[44px] flex items-center"
            >
              Ver todos →
            </button>
          </div>
        </div>

        {/* Match carousel */}
        {matches.length > 0 && (
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1 -mx-1 px-1">
            {matches.map((g, i) => (
              <MatchCard key={g.id} game={g} index={i} />
            ))}
          </div>
        )}

        {/* Events grid */}
        {events.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {events.map((e, i) => (
              <EventCard key={e.id} event={e} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
