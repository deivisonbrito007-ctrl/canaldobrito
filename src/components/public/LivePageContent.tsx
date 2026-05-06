import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Clock, Calendar, Flame, Info } from "lucide-react";
import { useAllDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import { useLiveTick } from "@/hooks/useLiveTick";
import { useRealtimeDailyGames } from "@/hooks/useRealtimeDailyGames";
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
import { getSportTheme, isHighlightCompetition } from "./schedule/GameCardSportTheme";
import { cn } from "@/lib/utils";

type FilterId = "all" | "football" | "basketball" | "other";

const FILTERS: { id: FilterId; label: string; emoji: string }[] = [
  { id: "all", label: "Todos", emoji: "🔥" },
  { id: "football", label: "Futebol", emoji: "⚽" },
  { id: "basketball", label: "Basquete", emoji: "🏀" },
  { id: "other", label: "Outros", emoji: "🏆" },
];

// Sport accents now come from getSportTheme (single source of truth shared with Programação).

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

/* ── Live Game Card (matches Programação visual identity) ── */
const LiveGameCard = ({ game }: { game: DailyGame }) => {
  const sportType = (game.sport_type || "football") as SportType;
  const elapsed = getElapsedMinutes(game.game_time, game.date, sportType);
  const emoji = SPORT_EMOJI[sportType] || "⚽";
  const sportLabel = SPORT_LABEL[sportType] || "Esporte";
  const theme = getSportTheme(sportType);
  const highlight = isHighlightCompetition(game.competition);
  const isEvent = isNonAdversarial(sportType) || !game.away_team || game.away_team === game.home_team;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="group min-w-0"
    >
      <div
        className="relative rounded-2xl overflow-hidden bg-card/70 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5"
        style={{
          border: `1px solid hsl(var(--live) / 0.55)`,
          boxShadow: theme.glow,
        }}
      >
        {/* Sport identity strip */}
        <div
          className="flex items-center justify-between px-3 py-1.5 text-foreground"
          style={{ background: theme.stripGradient }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[13px] leading-none" aria-hidden>{emoji}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] truncate">
              {sportLabel}
            </span>
            <span className="text-foreground/40 text-[10px]">·</span>
            <span className="text-[10px] font-semibold text-foreground/85 truncate max-w-[40vw] sm:max-w-[180px]">
              {game.competition}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-destructive/20 border border-destructive/40">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full motion-safe:animate-ping bg-destructive opacity-70" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
            </span>
            <span className="text-[9px] font-extrabold tabular-nums text-destructive font-body">
              {elapsed !== null ? `${elapsed}'` : "AO VIVO"}
            </span>
          </span>
        </div>

        {/* Watermark */}
        <span
          aria-hidden
          className="pointer-events-none select-none absolute -right-2 -bottom-3 text-[88px] leading-none opacity-[0.05]"
        >
          {emoji}
        </span>

        <div className="relative p-3 space-y-2.5">
          {game.competition_detail && (
            <p className="text-[10px] text-muted-foreground/70 font-medium truncate">
              {game.competition_detail}
            </p>
          )}

          {/* Teams / Event */}
          {isEvent ? (
            <div className="flex items-center gap-3">
              <p className="flex-1 text-center text-[13px] sm:text-base font-bold text-foreground leading-tight truncate min-w-0">
                {game.home_team}
                {game.away_team && game.away_team !== game.home_team && (
                  <span className="block text-[11px] font-medium text-muted-foreground/70 mt-0.5 truncate">
                    {game.away_team}
                  </span>
                )}
              </p>
              <TimePill time={game.game_time} themeColor={theme.color} />
            </div>
          ) : (
            <div className="flex items-stretch gap-2 min-w-0">
              <p className="flex-1 text-left text-[13px] sm:text-sm font-bold text-foreground leading-tight truncate min-w-0" title={game.home_team}>
                {game.home_team}
              </p>
              <div className="flex flex-col items-center shrink-0">
                <TimePill time={game.game_time} themeColor={theme.color} />
                <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50 mt-0.5">vs</span>
              </div>
              <p className="flex-1 text-right text-[13px] sm:text-sm font-bold text-foreground leading-tight truncate min-w-0" title={game.away_team}>
                {game.away_team}
              </p>
            </div>
          )}

          {/* Channels — same pattern as Programação */}
          {game.channels && game.channels.length > 0 ? (
            <div className="space-y-1.5">
              <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/55">
                ▶ Onde assistir
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {game.channels.slice(0, 3).map((ch, i) => (
                  <ChannelBadge key={i} name={ch} />
                ))}
                {game.channels.length > 3 && (
                  <span className="inline-flex items-center text-[10px] font-bold text-muted-foreground/70 bg-card/40 border border-border/30 rounded-md px-2 py-1">
                    +{game.channels.length - 3}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60 px-2 py-0.5 rounded border border-border/40 bg-muted/20 self-start inline-block">
              Sem transmissão confirmada
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
};

const TimePill = ({ time, themeColor }: { time: string | null | undefined; themeColor: string }) => (
  <div
    className="flex items-center gap-1 rounded-lg px-2.5 py-1 border tabular-nums bg-card/50 border-border/40"
    style={{ color: themeColor }}
  >
    <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
    <span className="text-xs sm:text-sm font-bold tracking-wide">{time?.slice(0, 5)}</span>
  </div>
);

/* ── Upcoming Card (compact, sport-themed) ── */
const UpcomingCard = ({ game, minutesUntil, isNext = false }: { game: DailyGame; minutesUntil: number; isNext?: boolean }) => {
  const sportType = (game.sport_type || "football") as SportType;
  const emoji = SPORT_EMOJI[sportType] || "⚽";
  const theme = getSportTheme(sportType);
  const isEvent = isNonAdversarial(sportType) || !game.away_team || game.away_team === game.home_team;
  return (
    <div
      className={cn(
        "relative rounded-xl bg-card/70 backdrop-blur-xl p-2.5 flex items-center gap-2.5 transition-colors hover:bg-card",
        isNext && "ring-1 ring-primary/40"
      )}
      style={{ borderLeft: `3px solid ${theme.color}`, border: `1px solid ${theme.border}`, borderLeftWidth: 3 }}
    >
      <div className="flex flex-col items-center justify-center min-w-[42px] px-1.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
        {isNext && (
          <span className="text-[7px] font-extrabold text-primary uppercase tracking-[0.16em] leading-none mb-0.5">★</span>
        )}
        <span className="text-[8px] font-bold text-primary uppercase tracking-wide font-body leading-none">em</span>
        <span className="text-[13px] font-extrabold text-primary tabular-nums font-body leading-none mt-0.5">
          {minutesUntil}m
        </span>
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground truncate font-body">
          {emoji} {game.competition}
          {game.competition_detail && ` · ${game.competition_detail}`}
        </p>
        <p className="text-[12px] font-bold text-foreground leading-tight font-body line-clamp-1">
          {isEvent ? game.home_team : `${game.home_team} vs ${game.away_team}`}
        </p>
        {game.channels && game.channels.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground/55 mr-0.5">▶</span>
            {game.channels.slice(0, 2).map((ch, i) => (
              <ChannelBadge key={i} name={ch} size="sm" />
            ))}
            {game.channels.length > 2 && (
              <span className="text-[9px] font-bold text-muted-foreground/70">+{game.channels.length - 2}</span>
            )}
          </div>
        )}
      </div>
      <span className="text-[10px] font-bold text-foreground tabular-nums font-body shrink-0 self-start">
        {game.game_time?.slice(0, 5)}
      </span>
    </div>
  );
};

/* ── Notice Banner (fixo, sempre visível) ── */
const LiveNotice = () => {
  return (
    <div
      role="status"
      className="mx-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/25 px-2.5 py-1.5 flex items-center gap-2"
    >
      <Info className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-hidden="true" />
      <p className="flex-1 min-w-0 text-[10.5px] leading-snug text-amber-100/85 font-body">
        <span className="font-bold text-amber-300 uppercase tracking-wide">Aviso:</span>{" "}
        Os canais e horários podem sofrer alterações de última hora sem aviso prévio. Agradecemos a compreensão!
      </p>
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
  useRealtimeDailyGames();
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
    const liveKeys = new Set(
      liveGames.map((g) => `${(g.competition || "").toLowerCase().trim()}|${(g.home_team || "").toLowerCase().trim()}`)
    );
    return all
      .map((g) => {
        const [h, m] = (g.game_time || "00:00").split(":").map(Number);
        const start = new Date(`${g.date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00-03:00`);
        const diffMin = Math.round((start.getTime() - now.getTime()) / 60_000);
        return { g, diffMin };
      })
      .filter(({ g, diffMin }) => {
        if (diffMin <= 0 || diffMin > 60) return false;
        const key = `${(g.competition || "").toLowerCase().trim()}|${(g.home_team || "").toLowerCase().trim()}`;
        return !liveKeys.has(key);
      })
      .sort((a, b) => a.diffMin - b.diffMin)
      .slice(0, 5);
  }, [all, liveGames, tick]);

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
      {/* ─── Hero Header — STICKY para reduzir confusão com "Em breve" ─── */}
      <section className="sticky top-[52px] sm:top-[60px] z-40 px-3 pt-2 pb-1 -mb-1 bg-background/85 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/70 animate-fade-up">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-destructive/15 via-card to-card border border-destructive/40 shadow-[0_6px_20px_-8px_hsl(var(--destructive)/0.4)]">
          <div className="absolute inset-0 rounded-2xl border border-destructive/40 motion-safe:animate-pulse pointer-events-none" />

          <div className="relative px-3 py-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 border border-destructive/40 px-2 py-0.5 shrink-0">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-destructive motion-safe:animate-ping opacity-70" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
                  </span>
                  <span className="text-[9px] uppercase font-extrabold tracking-wider text-destructive font-body">
                    Ao Vivo
                  </span>
                </span>
                {hasLive ? (
                  <h1
                    className="text-base font-extrabold text-foreground font-body leading-none tracking-tight truncate"
                    aria-live="polite"
                  >
                    {liveGames.length}{" "}
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {liveGames.length === 1 ? "jogo agora" : "jogos agora"}
                    </span>
                  </h1>
                ) : (
                  <p
                    className="text-[11px] text-muted-foreground font-body truncate"
                    aria-live="polite"
                  >
                    Sem jogos ao vivo no momento
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <LiveClock />
                <AnimatePresence>
                  {(justUpdated || isFetching) && (
                    <motion.span
                      key={isFetching ? "fetching" : "updated"}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className="relative flex h-1.5 w-1.5"
                      aria-label={isFetching ? "Atualizando" : "Atualizado"}
                    >
                      <span className="absolute inline-flex h-full w-full rounded-full bg-primary motion-safe:animate-ping opacity-70" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Filter pills — só aparece se ≥2 categorias com live games */}
            {hasLive && (() => {
              const visibleFilters = FILTERS.filter((f) => f.id === "all" || stats[f.id] > 0);
              if (visibleFilters.length < 3) return null; // "all" + 2+ esportes
              return (
                <div className="relative -mx-1">
                  <div
                    data-horizontal-scroll
                    className="flex gap-1.5 overflow-x-auto scrollbar-hide px-1 [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]"
                    role="tablist"
                    aria-label="Filtrar por esporte"
                  >
                    {visibleFilters.map((f) => {
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
              );
            })()}
          </div>
        </div>
      </section>

      {/* ─── Aviso informativo ─── */}
      <LiveNotice />

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

      {/* ─── Live Grid — bloco vermelho destacado ─── */}
      {!isLoading && liveGames.length > 0 && (
        <section className="animate-fade-up stagger-2">
          {/* Section banner LIVE — vermelho, claro e inconfundível */}
          <div className="px-3 mb-2.5">
            <div className="relative overflow-hidden rounded-xl border border-destructive/40 bg-gradient-to-r from-destructive/20 via-destructive/10 to-transparent">
              <div className="absolute inset-y-0 left-0 w-1 bg-destructive shadow-[0_0_12px_hsl(var(--destructive)/0.6)]" />
              <div className="relative flex items-center gap-2 pl-3.5 pr-3 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-destructive motion-safe:animate-ping opacity-70" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                </span>
                <h2 className="text-[12px] font-extrabold text-destructive font-body uppercase tracking-[0.18em]">
                  {filter === "all" ? "Ao vivo agora" : FILTERS.find((f) => f.id === filter)?.label}
                </h2>
                <span className="text-[10px] bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 font-extrabold tabular-nums font-body shadow-[0_0_10px_hsl(var(--destructive)/0.5)]">
                  {filteredLive.length}
                </span>
                <Flame className="h-3.5 w-3.5 text-destructive ml-auto motion-safe:animate-pulse" aria-hidden />
              </div>
            </div>
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

      {/* ─── Divisor visual entre AO VIVO e PRÓXIMOS ─── */}
      {!isLoading && liveGames.length > 0 && upcoming.length > 0 && (
        <div className="px-6" aria-hidden>
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      )}

      {/* ─── Upcoming — bloco verde discreto, claramente separado ─── */}
      {!isLoading && upcoming.length > 0 && (
        <section className="animate-fade-up stagger-3">
          <div className="px-3 mb-2">
            <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
              <div className="absolute inset-y-0 left-0 w-1 bg-primary/60" />
              <div className="relative flex items-center gap-2 pl-3.5 pr-3 py-2">
                <Clock className="h-3.5 w-3.5 text-primary" aria-hidden />
                <h2 className="text-[12px] font-extrabold text-primary font-body uppercase tracking-[0.18em]">
                  Em breve
                </h2>
                <span className="text-[10px] text-foreground/70 font-body">
                  · próximo em <span className="font-extrabold text-primary tabular-nums">{upcoming[0].diffMin}min</span>
                </span>
                <span className="ml-auto text-[10px] bg-primary/15 text-primary rounded-full px-1.5 py-0.5 font-extrabold tabular-nums font-body">
                  {upcoming.length}
                </span>
              </div>
              <div className="h-[2px] bg-primary/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
                  style={{ width: `${Math.max(8, 100 - (upcoming[0].diffMin / 60) * 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="px-3 space-y-1.5 opacity-95">
            {upcoming.map(({ g, diffMin }, i) => (
              <UpcomingCard key={g.id} game={g} minutesUntil={diffMin} isNext={i === 0} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default LivePageContent;
