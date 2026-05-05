import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Clock, Calendar, Flame, Trophy } from "lucide-react";
import { useAllDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import { useLiveTick } from "@/hooks/useLiveTick";
import {
  isGameCurrentlyLive,
  getLocalDateString,
  getElapsedMinutes,
  SPORT_EMOJI,
  SPORT_LABEL,
  isNonAdversarial,
  type SportType,
} from "@/lib/gameUtils";
import { ChannelBadge } from "./ChannelBadge";
import { cn } from "@/lib/utils";

type FilterId = "all" | "football" | "basketball" | "other";

const FILTERS: { id: FilterId; label: string; emoji: string }[] = [
  { id: "all", label: "Todos", emoji: "🔥" },
  { id: "football", label: "Futebol", emoji: "⚽" },
  { id: "basketball", label: "Basquete", emoji: "🏀" },
  { id: "other", label: "Outros", emoji: "🏆" },
];

const SPORT_ACCENT: Record<string, string> = {
  football: "from-destructive to-red-700",
  basketball: "from-blue-500 to-blue-700",
  volleyball: "from-purple-500 to-purple-700",
  tennis: "from-emerald-500 to-emerald-700",
  f1: "from-amber-500 to-orange-600",
  mma: "from-orange-500 to-red-600",
  hockey: "from-sky-500 to-sky-700",
  baseball: "from-yellow-500 to-yellow-700",
  rugby: "from-green-600 to-green-800",
  surf: "from-cyan-500 to-cyan-700",
  cycling: "from-pink-500 to-pink-700",
  boxing: "from-red-600 to-red-800",
  swimming: "from-teal-500 to-teal-700",
  golf: "from-lime-500 to-lime-700",
};

const matchesFilter = (st: SportType, f: FilterId): boolean => {
  if (f === "all") return true;
  if (f === "football") return st === "football";
  if (f === "basketball") return st === "basketball";
  return st !== "football" && st !== "basketball";
};

/* ── Live Clock ── */
const LiveClock = () => {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "America/Sao_Paulo" })
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "America/Sao_Paulo" }));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="text-sm sm:text-base font-bold tabular-nums text-foreground font-body">{time}</span>
  );
};

/* ── Live Game Card ── */
const LiveGameCard = ({ game }: { game: DailyGame }) => {
  const sportType = (game.sport_type || "football") as SportType;
  const elapsed = getElapsedMinutes(game.game_time, game.date, sportType);
  const emoji = SPORT_EMOJI[sportType] || "⚽";
  const accent = SPORT_ACCENT[sportType] || SPORT_ACCENT.football;
  const isEvent = isNonAdversarial(sportType) || !game.away_team || game.away_team === game.home_team;
  const indicatorColor = isEvent ? "amber-500" : "destructive";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-2xl bg-card border border-border/60 overflow-hidden",
        "transition-all duration-300 hover:-translate-y-1 hover:border-destructive/40",
        "hover:shadow-[0_8px_24px_hsl(0,84%,60%,0.18)] group"
      )}
    >
      {/* Accent bar w/ shimmer */}
      <div className={cn("relative h-1 overflow-hidden bg-gradient-to-r", accent)}>
        <div className="absolute inset-0 -translate-x-full animate-shimmer-sweep bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      <div className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground truncate font-body min-w-0">
            {emoji} {game.competition}
            {game.competition_detail && ` · ${game.competition_detail}`}
          </p>
          <div className={cn(
            "inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-full border",
            isEvent
              ? "bg-amber-500/15 border-amber-500/30"
              : "bg-destructive/15 border-destructive/30"
          )}>
            <span className="relative flex h-1.5 w-1.5">
              <span className={cn("absolute inline-flex h-full w-full rounded-full animate-ping opacity-70",
                isEvent ? "bg-amber-500" : "bg-destructive")} />
              <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5",
                isEvent ? "bg-amber-500" : "bg-destructive")} />
            </span>
            <span className={cn("text-[9px] font-extrabold tabular-nums font-body",
              isEvent ? "text-amber-500" : "text-destructive")}>
              {elapsed !== null ? `${elapsed}'` : "LIVE"}
            </span>
          </div>
        </div>

        {/* Teams / Event */}
        {isEvent ? (
          <div className="text-center">
            <p className="text-[13px] font-extrabold text-foreground leading-tight font-body line-clamp-2">
              {game.home_team}
              {game.away_team && game.away_team !== game.home_team && ` — ${game.away_team}`}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-extrabold text-foreground flex-1 leading-tight font-body line-clamp-2">
              {game.home_team}
            </p>
            <span className="text-[9px] font-extrabold text-destructive shrink-0 px-1.5 py-0.5 rounded bg-gradient-to-br from-destructive/20 to-destructive/5 border border-destructive/30">
              VS
            </span>
            <p className="text-[13px] font-extrabold text-foreground flex-1 text-right leading-tight font-body line-clamp-2">
              {game.away_team}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 flex items-center justify-between gap-2 border-t border-border/40 bg-muted/20">
        <div className="flex items-center gap-1 text-muted-foreground/80 min-w-0">
          <Clock className="h-3 w-3 shrink-0" />
          <span className="text-[9px] font-medium tabular-nums font-body truncate">
            {game.game_time?.slice(0, 5)}
          </span>
        </div>
        {game.channels && game.channels.length > 0 ? (
          <div className="flex gap-1 items-center justify-end flex-wrap">
            {game.channels.slice(0, 2).map((ch) => (
              <ChannelBadge key={ch} name={ch} size="sm" />
            ))}
            {game.channels.length > 2 && (
              <span className="text-[9px] text-muted-foreground/70 font-bold">
                +{game.channels.length - 2}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground/60">Sem TV</span>
        )}
      </div>
    </motion.div>
  );
};

/* ── Upcoming Card (compact) ── */
const UpcomingCard = ({ game, minutesUntil }: { game: DailyGame; minutesUntil: number }) => {
  const sportType = (game.sport_type || "football") as SportType;
  const emoji = SPORT_EMOJI[sportType] || "⚽";
  const isEvent = isNonAdversarial(sportType) || !game.away_team || game.away_team === game.home_team;
  return (
    <div className="rounded-xl bg-card border border-border/60 p-2 flex items-center gap-2 hover:border-primary/30 transition-colors">
      <div className="flex flex-col items-center justify-center min-w-[38px] px-1.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
        <span className="text-[8px] font-bold text-primary uppercase tracking-wide font-body leading-none">em</span>
        <span className="text-[13px] font-extrabold text-primary tabular-nums font-body leading-none mt-0.5">
          {minutesUntil}m
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground truncate font-body">
          {emoji} {game.competition}
          {game.competition_detail && ` · ${game.competition_detail}`}
        </p>
        <p className="text-[12px] font-bold text-foreground leading-tight font-body line-clamp-1">
          {isEvent ? game.home_team : `${game.home_team} vs ${game.away_team}`}
        </p>
      </div>
      <div className="flex flex-col items-end shrink-0 gap-1">
        <span className="text-[9px] font-bold text-foreground tabular-nums font-body">
          {game.game_time?.slice(0, 5)}
        </span>
        {game.channels?.[0] && <ChannelBadge name={game.channels[0]} size="sm" />}
      </div>
    </div>
  );
};

/* ── Empty State ── */
const EmptyLive = () => (
  <div className="mx-3 rounded-2xl bg-card border border-border/60 p-4 text-center space-y-3">
    <div className="mx-auto w-11 h-11 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-center">
      <Radio className="h-5 w-5 text-muted-foreground" />
    </div>
    <div className="space-y-1">
      <h3 className="text-sm font-extrabold text-foreground font-body">
        Nenhum jogo ao vivo agora
      </h3>
      <p className="text-[11px] text-muted-foreground font-body leading-relaxed">
        Veja a programação para os próximos eventos.
      </p>
    </div>
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("nav-tab-change", { detail: "schedule" }))}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold font-body min-h-[44px] hover:brightness-110 transition-all"
    >
      <Calendar className="h-4 w-4" />
      Ver programação
    </button>
  </div>
);

/* ── Main ── */
export const LivePageContent = () => {
  const tick = useLiveTick();
  const today = useMemo(() => getLocalDateString(), [tick]);
  const { data: games, isLoading, isFetching, dataUpdatedAt } = useAllDailyGames(today);
  const [justUpdated, setJustUpdated] = useState(false);
  const prevUpdatedRef = useState({ t: 0 })[0];

  useEffect(() => {
    if (!dataUpdatedAt) return;
    if (prevUpdatedRef.t === 0) {
      prevUpdatedRef.t = dataUpdatedAt;
      return;
    }
    if (dataUpdatedAt > prevUpdatedRef.t) {
      prevUpdatedRef.t = dataUpdatedAt;
      setJustUpdated(true);
      const id = setTimeout(() => setJustUpdated(false), 2200);
      return () => clearTimeout(id);
    }
  }, [dataUpdatedAt, prevUpdatedRef]);
  const [filter, setFilter] = useState<FilterId>("all");

  const all = useMemo(
    () => (games || []).filter((g) => !g.archived && g.active),
    [games]
  );

  const liveGames = useMemo(
    () =>
      all.filter((g) => {
        const st = (g.sport_type || "football") as SportType;
        return isGameCurrentlyLive(g.game_time, g.date, st);
      }),
    [all, tick]
  );

  const upcoming = useMemo(() => {
    const now = new Date();
    return all
      .map((g) => {
        const [h, m] = (g.game_time || "00:00").split(":").map(Number);
        const start = new Date(`${g.date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00-03:00`);
        const diffMin = Math.round((start.getTime() - now.getTime()) / 60_000);
        return { g, diffMin };
      })
      .filter(({ diffMin }) => diffMin > 0 && diffMin <= 60)
      .sort((a, b) => a.diffMin - b.diffMin)
      .slice(0, 5);
  }, [all, tick]);

  // Stats by filter category
  const stats = useMemo(() => {
    const s = { all: liveGames.length, football: 0, basketball: 0, other: 0 };
    liveGames.forEach((g) => {
      const st = (g.sport_type || "football") as SportType;
      if (st === "football") s.football++;
      else if (st === "basketball") s.basketball++;
      else s.other++;
    });
    return s;
  }, [liveGames]);

  const filteredLive = useMemo(
    () =>
      liveGames.filter((g) => matchesFilter((g.sport_type || "football") as SportType, filter)),
    [liveGames, filter]
  );

  const hasLive = liveGames.length > 0;

  return (
    <div className="space-y-4 min-h-[80vh] pb-[calc(1rem+env(safe-area-inset-bottom))]">
      {/* ─── Hero Header ─── */}
      <section className="px-3 pt-4 animate-fade-up">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-destructive/10 via-card to-card border border-destructive/30">
          {/* Pulsing glow border (respects prefers-reduced-motion) */}
          <div className="absolute inset-0 rounded-2xl border border-destructive/40 motion-safe:animate-pulse pointer-events-none" />
          {/* Background glow blob */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-destructive/10 blur-3xl pointer-events-none" />

          <div className="relative p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 border border-destructive/40 px-2.5 py-1">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-destructive motion-safe:animate-ping opacity-70" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                  </span>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-destructive font-body">
                    Ao Vivo
                  </span>
                </div>
                {hasLive ? (
                  <h1
                    className="text-xl sm:text-3xl font-extrabold text-foreground font-body leading-none tracking-tight"
                    aria-live="polite"
                  >
                    {liveGames.length}{" "}
                    <span className="text-sm sm:text-base font-bold text-muted-foreground">
                      {liveGames.length === 1 ? "jogo agora" : "jogos agora"}
                    </span>
                  </h1>
                ) : (
                  <p
                    className="text-[11px] sm:text-xs text-muted-foreground font-body"
                    aria-live="polite"
                  >
                    Sem jogos ao vivo no momento
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end shrink-0 gap-1">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-body">
                  Brasília
                </span>
                <LiveClock />
                <AnimatePresence>
                  {(justUpdated || isFetching) && (
                    <motion.div
                      key={isFetching ? "fetching" : "updated"}
                      initial={{ opacity: 0, y: -4, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5"
                      aria-live="polite"
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-primary motion-safe:animate-ping opacity-70" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-primary font-body">
                        {isFetching ? "Atualizando" : "Atualizado"}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Filter pills — only show when there are live games */}
            {hasLive && (
              <div className="relative -mx-1">
                <div
                  data-horizontal-scroll
                  className="flex gap-1.5 overflow-x-auto scrollbar-hide px-1 [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]"
                  role="tablist"
                  aria-label="Filtrar por esporte"
                >
                  {FILTERS.filter((f) => f.id === "all" || stats[f.id] > 0).map((f) => {
                    const count = stats[f.id];
                    const active = filter === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        role="tab"
                        aria-selected={active}
                        aria-label={`${f.label} (${count} ao vivo)`}
                        className={cn(
                          "shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all duration-200 min-h-[40px]",
                          "text-[11px] font-bold font-body",
                          active
                            ? "bg-destructive text-destructive-foreground border-destructive shadow-[0_0_12px_hsl(0,84%,60%,0.4)]"
                            : "bg-card/60 text-foreground/80 border-border/60 hover:border-destructive/30 hover:text-foreground"
                        )}
                      >
                        <span>{f.emoji}</span>
                        <span>{f.label}</span>
                        <span
                          className={cn(
                            "tabular-nums px-1.5 py-0.5 rounded-md text-[9px] font-extrabold",
                            active ? "bg-destructive-foreground/20 text-destructive-foreground" : "bg-muted/50 text-muted-foreground"
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Loading ─── */}
      {isLoading && (
        <div className="px-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[112px] rounded-2xl skeleton-shimmer" />
          ))}
        </div>
      )}

      {/* ─── Empty State ─── */}
      {!isLoading && liveGames.length === 0 && <EmptyLive />}

      {/* ─── Live Grid ─── */}
      {!isLoading && liveGames.length > 0 && (
        <section className="space-y-2.5 animate-fade-up stagger-2">
          <div className="px-3 flex items-center gap-2">
            <Flame className="h-4 w-4 text-destructive" />
            <h2 className="text-sm font-extrabold text-foreground font-body uppercase tracking-tight">
              {filter === "all" ? "Acontecendo agora" : FILTERS.find((f) => f.id === filter)?.label}
            </h2>
            <span className="text-[10px] bg-destructive/15 text-destructive rounded-full px-2 py-0.5 font-bold tabular-nums font-body">
              {filteredLive.length}
            </span>
          </div>

          {filteredLive.length === 0 ? (
            <div className="mx-3 rounded-xl border border-border/60 bg-card/60 p-4 text-center">
              <p className="text-xs text-muted-foreground font-body">
                Nenhum jogo desse tipo ao vivo agora.
              </p>
            </div>
          ) : (
            <div className="px-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <AnimatePresence mode="popLayout">
                {filteredLive.map((g) => (
                  <LiveGameCard key={g.id} game={g} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      )}

      {/* ─── Upcoming ─── */}
      {!isLoading && upcoming.length > 0 && (
        <section className="space-y-2.5 animate-fade-up stagger-3">
          <div className="px-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-extrabold text-foreground font-body uppercase tracking-tight">
              Começam em breve
            </h2>
            <span className="text-[10px] bg-primary/15 text-primary rounded-full px-2 py-0.5 font-bold tabular-nums font-body">
              {upcoming.length}
            </span>
          </div>
          <div className="px-3 space-y-1.5">
            {upcoming.map(({ g, diffMin }) => (
              <UpcomingCard key={g.id} game={g} minutesUntil={diffMin} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default LivePageContent;
