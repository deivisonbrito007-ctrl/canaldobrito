import { useDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarOff, Clock, Flame, Trophy, ChevronDown, Bell, BellOff, X } from "lucide-react";
import { useLiveTick } from "@/hooks/useLiveTick";
import { isGameCurrentlyLive, getLocalDateString, getTomorrowDateString, getMinutesUntilStart, formatCountdown, isNonAdversarial, SPORT_EMOJI, SPORT_LABEL, type SportType } from "@/lib/gameUtils";
import { ChannelBadge } from "./ChannelBadge";
import { DayStatsBar } from "./DayStatsBar";
import { NextGameHero } from "./NextGameHero";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { toast } from "sonner";

/* ── colour maps ── */
const COMP_COLORS: Record<string, { bg: string; border: string }> = {
  "brasileirão":          { bg: "bg-emerald-500/20", border: "border-emerald-500/50" },
  "brasileirao":          { bg: "bg-emerald-500/20", border: "border-emerald-500/50" },
  "campeonato brasileiro":{ bg: "bg-emerald-500/20", border: "border-emerald-500/50" },
  "champions league":     { bg: "bg-blue-500/20",    border: "border-blue-500/50" },
  "copa do brasil":       { bg: "bg-yellow-500/20",   border: "border-yellow-500/50" },
  "liga europa":          { bg: "bg-orange-500/20",   border: "border-orange-500/50" },
  "europa league":        { bg: "bg-orange-500/20",   border: "border-orange-500/50" },
  "conference league":    { bg: "bg-teal-500/20",     border: "border-teal-500/50" },
  "concacaf":             { bg: "bg-purple-500/20",   border: "border-purple-500/50" },
  "la liga":              { bg: "bg-orange-600/20",   border: "border-orange-600/50" },
  "premier league":       { bg: "bg-purple-700/20",   border: "border-purple-700/50" },
  "campeonato inglês":    { bg: "bg-purple-700/20",   border: "border-purple-700/50" },
  "campeonato turco":     { bg: "bg-red-600/20",      border: "border-red-600/50" },
  "serie a":              { bg: "bg-blue-600/20",     border: "border-blue-600/50" },
  "libertadores":         { bg: "bg-amber-500/20",    border: "border-amber-500/50" },
  "sul-americana":        { bg: "bg-red-500/20",      border: "border-red-500/50" },
  "copa de la reina":     { bg: "bg-pink-500/20",     border: "border-pink-500/50" },
  "copa do rei":          { bg: "bg-yellow-600/20",   border: "border-yellow-600/50" },
};

/* ── Sport badge background colors (inline style) ── */
const SPORT_BADGE_BG: Record<string, string> = {
  football: "#e53e3e",
  basketball: "#3b82f6",
  volleyball: "#8b5cf6",
  tennis: "#10b981",
  f1: "#f59e0b",
  mma: "#f97316",
  hockey: "#0ea5e9",
  baseball: "#ca8a04",
  rugby: "#16a34a",
  surf: "#06b6d4",
  cycling: "#ec4899",
  boxing: "#dc2626",
  swimming: "#14b8a6",
  golf: "#65a30d",
};

const COMP_TOP_COLORS: Record<string, string> = {
  "brasileirão":          "from-emerald-500",
  "brasileirao":          "from-emerald-500",
  "campeonato brasileiro":"from-emerald-500",
  "champions league":     "from-blue-500",
  "copa do brasil":       "from-yellow-500",
  "liga europa":          "from-orange-500",
  "europa league":        "from-orange-500",
  "conference league":    "from-teal-500",
  "concacaf":             "from-purple-500",
  "la liga":              "from-orange-600",
  "premier league":       "from-purple-700",
  "campeonato inglês":    "from-purple-700",
  "campeonato turco":     "from-red-600",
  "serie a":              "from-blue-600",
  "libertadores":         "from-amber-500",
  "sul-americana":        "from-red-500",
  "copa de la reina":     "from-pink-500",
  "copa do rei":          "from-yellow-600",
};

const HIGHLIGHT_COMPS = [
  "champions league", "brasileirão", "brasileirao", "campeonato brasileiro",
  "libertadores", "copa do brasil", "premier league", "campeonato inglês",
];

/* ── helpers ── */
function matchKey(input: string, map: Record<string, any>) {
  const key = input.toLowerCase().trim();
  for (const [k, v] of Object.entries(map)) {
    if (key.includes(k)) return v;
  }
  return null;
}

function getCompColor(comp: string) {
  return matchKey(comp, COMP_COLORS) ?? { bg: "bg-muted/30", border: "border-muted/20" };
}

function getTopColor(comp: string) {
  return matchKey(comp, COMP_TOP_COLORS) ?? "from-muted";
}

function isHighlight(comp: string) {
  const key = comp.toLowerCase().trim();
  return HIGHLIGHT_COMPS.some((c) => key.includes(c));
}

function isGameLive(game: DailyGame): boolean {
  return isGameCurrentlyLive(game.game_time, game.date, (game.sport_type || 'football') as SportType);
}

type TimeGroup = "morning" | "afternoon" | "night" | "dawn";

function getTimeGroup(time: string): TimeGroup {
  const h = parseInt(time.split(":")[0], 10);
  if (h < 6)  return "dawn";
  if (h < 13) return "morning";
  if (h < 18) return "afternoon";
  return "night";
}

const GROUP_META: Record<TimeGroup, { label: string; emoji: string }> = {
  morning:   { label: "Manhã",     emoji: "🌅" },
  afternoon: { label: "Tarde",     emoji: "☀️" },
  night:     { label: "Noite",     emoji: "🌙" },
  dawn:      { label: "Madrugada", emoji: "🌃" },
};

const GROUP_ORDER: TimeGroup[] = ["morning", "afternoon", "night", "dawn"];

/* ── Reminder helpers ── */
function getReminders(): string[] {
  try {
    return JSON.parse(localStorage.getItem("game_reminders") || "[]");
  } catch {
    return [];
  }
}

function toggleReminder(gameId: string): boolean {
  const reminders = getReminders();
  const idx = reminders.indexOf(gameId);
  if (idx >= 0) {
    reminders.splice(idx, 1);
    localStorage.setItem("game_reminders", JSON.stringify(reminders));
    return false;
  } else {
    reminders.push(gameId);
    localStorage.setItem("game_reminders", JSON.stringify(reminders));
    return true;
  }
}

/* ── Game Card ── */
const GameCard = ({ game, index, onPushReminder }: { game: DailyGame; index: number; onPushReminder?: (gameId: string, add: boolean) => void }) => {
  const sportType = (game.sport_type || 'football') as SportType;
  const sportEmoji = SPORT_EMOJI[sportType] || '⚽';
  const live = isGameLive(game);
  const highlight = isHighlight(game.competition);
  const compColor = getCompColor(game.competition);
  const topGradient = getTopColor(game.competition);

  const minsUntil = getMinutesUntilStart(game.game_time, game.date);
  const isSoon = minsUntil !== null && minsUntil <= 120 && minsUntil > 0;

  const [reminded, setReminded] = useState(() => getReminders().includes(game.id));

  const handleReminder = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const isNowReminded = toggleReminder(game.id);
    setReminded(isNowReminded);
    onPushReminder?.(game.id, isNowReminded);
  }, [game.id, onPushReminder]);

  const gameLabel = game.away_team
    ? `${game.home_team} vs ${game.away_team}, ${game.competition}, ${game.game_time?.slice(0, 5)}`
    : `${game.home_team}, ${game.competition}, ${game.game_time?.slice(0, 5)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
      className="group min-w-0"
      role="article"
      aria-label={`${gameLabel}${live ? ', ao vivo' : ''}${game.is_womens ? ', feminino' : ''}`}
      tabIndex={0}
    >
      <div className={`relative rounded-2xl overflow-hidden border transition-all duration-300
        bg-card/60 backdrop-blur-xl
        ${highlight ? "border-primary/30 shadow-[0_0_20px_-8px_hsl(var(--primary)/0.15)]" : "border-border/20"}
        hover:border-primary/40 hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.2)] hover:-translate-y-0.5
        focus-within:ring-2 focus-within:ring-primary/50 focus-within:ring-offset-2 focus-within:ring-offset-background`}
      >
        {/* Top accent line */}
        <div className={`h-[3px] bg-gradient-to-r ${topGradient} to-transparent`} />

        <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
          {/* Competition badge + Live badge + Reminder */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white uppercase tracking-wide shrink-0"
                style={{ backgroundColor: SPORT_BADGE_BG[sportType] || "#e53e3e" }}
              >
                {sportEmoji} {SPORT_LABEL[sportType] || "Futebol"}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${compColor.bg} ${compColor.border} text-foreground/80 truncate max-w-[35vw] sm:max-w-[180px]`}>
                {game.competition}
              </span>
              {highlight && <Flame className="h-3.5 w-3.5 text-amber-400 animate-pulse" />}
            </div>
            <div className="flex items-center gap-1.5">
              {/* "Starts in X" indicator */}
              {isSoon && !live && minsUntil && (
                <span className="text-[9px] font-bold bg-warning/15 text-warning px-2 py-0.5 rounded-lg border border-warning/30 animate-pulse tabular-nums">
                  em {formatCountdown(minsUntil)}
                </span>
              )}
              {live && (
                <span className="flex items-center gap-1 text-[10px] bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-bold animate-pulse border border-destructive/30">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-60" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
                  </span>
                  AO VIVO
                </span>
              )}
              {game.is_womens && (
                <span className="text-[9px] bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-lg font-bold border border-pink-500/30">♀ FEM</span>
              )}
              {/* Reminder button */}
              {!live && (
                 <button
                   onClick={handleReminder}
                   aria-label={reminded ? `Remover lembrete de ${game.home_team}` : `Adicionar lembrete para ${game.home_team}`}
                   aria-pressed={reminded}
                   className={`p-1.5 rounded-lg transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
                     reminded
                       ? "bg-primary/15 text-primary border border-primary/30"
                       : "bg-card/40 text-muted-foreground/40 border border-transparent hover:text-primary/60 hover:bg-primary/5"
                   }`}
                 >
                   {reminded ? <Bell className="h-3.5 w-3.5" aria-hidden="true" /> : <BellOff className="h-3.5 w-3.5" aria-hidden="true" />}
                 </button>
              )}
            </div>
          </div>

          {/* Competition detail / round */}
          {game.competition_detail && (
            <p className="text-[10px] text-muted-foreground/70 font-medium truncate -mt-1">{game.competition_detail}</p>
          )}

          {/* Teams vs layout / Event layout */}
          {(isNonAdversarial(sportType) || !game.away_team) ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 text-center min-w-0">
                <p className="text-[13px] sm:text-sm font-bold text-foreground leading-tight truncate">
                  {game.home_team}
                </p>
                {game.competition_detail && (
                  <p className="text-[11px] text-muted-foreground/80 font-medium mt-0.5 truncate">
                    {game.competition_detail}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-center shrink-0">
                <div className="flex items-center gap-1.5 bg-primary/10 rounded-lg px-3 py-1.5 border border-primary/20">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-bold text-primary tabular-nums tracking-wide">{game.game_time?.slice(0, 5)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-[13px] sm:text-sm font-bold text-foreground flex-1 min-w-0 text-left truncate leading-tight">{game.home_team}</p>
              <div className="flex flex-col items-center shrink-0">
                <div className="flex items-center gap-1 bg-primary/10 rounded-lg px-2 py-1 border border-primary/20">
                  <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                  <span className="text-xs sm:text-sm font-bold text-primary tabular-nums tracking-wide">{game.game_time?.slice(0, 5)}</span>
                </div>
                <span className="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-0.5">vs</span>
              </div>
              <p className="text-[13px] sm:text-sm font-bold text-foreground flex-1 min-w-0 text-right truncate leading-tight">{game.away_team}</p>
            </div>
          )}

          {/* Channels */}
          {game.channels && game.channels.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {game.channels.slice(0, 3).map((ch, i) => (
                <ChannelBadge key={i} name={ch} />
              ))}
              {game.channels.length > 3 && (
                <span className="text-[10px] text-muted-foreground/50 self-center">+{game.channels.length - 3}</span>
              )}
            </div>
          ) : (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60 px-2 py-0.5 rounded border border-border/40 bg-muted/20 self-start">
              Sem transmissão confirmada
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ── Period Group (Collapsible) ── */
const PeriodGroup = ({ group, games, onPushReminder }: { group: TimeGroup; games: DailyGame[]; onPushReminder?: (gameId: string, add: boolean) => void }) => {
  const [open, setOpen] = useState(true);
  const meta = GROUP_META[group];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-3 w-full py-1 group/period min-h-[44px]" aria-label={`${meta.label}, ${games.length} jogos. ${open ? 'Clique para recolher' : 'Clique para expandir'}`}>
          <span className="text-base">{meta.emoji}</span>
          <span className="text-xs font-bold text-foreground/70 uppercase tracking-widest">{meta.label}</span>
          <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 tabular-nums">
            {games.length}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-border/40 to-transparent" />
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-2.5 sm:mt-3" role="list" aria-label={`Jogos do período ${meta.label}`}>
          {games.map((game, idx) => (
            <GameCard key={game.id} game={game} index={idx} onPushReminder={onPushReminder} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

/* ── Tomorrow Section (Collapsible) ── */
const TomorrowSection = ({ games, onPushReminder }: { games: DailyGame[]; onPushReminder?: (gameId: string, add: boolean) => void }) => {
  const [open, setOpen] = useState(false);
  const tomorrowStr = useMemo(() => {
    if (!games[0]) return "";
    try {
      return format(new Date(games[0].date + "T12:00:00"), "EEEE, d 'de' MMM", { locale: ptBR });
    } catch { return games[0].date; }
  }, [games]);

  const grouped = useMemo(() => {
    const groups: Record<TimeGroup, DailyGame[]> = { morning: [], afternoon: [], night: [], dawn: [] };
    games.forEach((g) => groups[getTimeGroup(g.game_time || "00:00")].push(g));
    return groups;
  }, [games]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-3 w-full py-2 group/tomorrow min-h-[44px]">
          <span className="text-base">📅</span>
          <span className="text-xs font-bold text-foreground/70 uppercase tracking-widest">Amanhã</span>
          <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 tabular-nums">
            {games.length} jogos
          </span>
          <span className="text-[10px] text-muted-foreground/50 capitalize">{tomorrowStr}</span>
          <div className="flex-1 h-px bg-gradient-to-r from-border/40 to-transparent" />
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-5 mt-2">
          {GROUP_ORDER.map((group) => {
            const groupGames = grouped[group];
            if (!groupGames || groupGames.length === 0) return null;
            return <PeriodGroup key={group} group={group} games={groupGames} onPushReminder={onPushReminder} />;
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

/* ── Section ── */
export const DailyGamesSection = () => {
  const tick = useLiveTick();
  const today = useMemo(() => getLocalDateString(), [tick]);
  const tomorrow = useMemo(() => getTomorrowDateString(), [tick]);
  const { data: games, isLoading } = useDailyGames(today);
  const { data: tomorrowGames } = useDailyGames(tomorrow);
  const [channelFilter, setChannelFilter] = useState<string | null>(null);
  const [compFilter, setCompFilter] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState<string | null>(null);
  const [openFilter, setOpenFilter] = useState<"sport" | "comp" | "channel" | null>(null);
  const { addGameReminder, removeGameReminder, isSupported: pushSupported } = usePushSubscription();

  const handlePushReminder = useCallback(async (gameId: string, add: boolean) => {
    if (!pushSupported) return;
    if (add) {
      const ok = await addGameReminder(gameId);
      if (ok) toast.success("Você será notificado 15min antes!");
    } else {
      await removeGameReminder(gameId);
    }
  }, [addGameReminder, removeGameReminder, pushSupported]);

  /* Dynamic filter options from today's games */
  const { availableSports, availableComps, availableChannels } = useMemo(() => {
    const allGames = games || [];
    const sports = new Set(allGames.map((g) => (g.sport_type || 'football') as SportType));
    
    const compMap: Record<string, number> = {};
    allGames.forEach((g) => {
      const key = g.competition.trim();
      compMap[key] = (compMap[key] || 0) + 1;
    });
    const comps = Object.entries(compMap)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));

    const channelMap: Record<string, number> = {};
    allGames.forEach((g) => {
      g.channels?.forEach((ch) => {
        const key = ch.trim();
        channelMap[key] = (channelMap[key] || 0) + 1;
      });
    });
    const channels = Object.entries(channelMap)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));

    return { availableSports: Array.from(sports), availableComps: comps, availableChannels: channels };
  }, [games]);

  const filteredGames = useMemo(() => {
    let result = games || [];
    if (sportFilter) result = result.filter((g) => (g.sport_type || 'football') === sportFilter);
    if (channelFilter) result = result.filter((g) => g.channels?.some((ch) => ch.toLowerCase().includes(channelFilter.toLowerCase())));
    if (compFilter) result = result.filter((g) => g.competition.toLowerCase().includes(compFilter.toLowerCase()));
    return result;
  }, [games, channelFilter, compFilter, sportFilter]);

  const grouped = useMemo(() => {
    const groups: Record<TimeGroup, typeof filteredGames> = { morning: [], afternoon: [], night: [], dawn: [] };
    filteredGames.forEach((g) => {
      groups[getTimeGroup(g.game_time || "00:00")].push(g);
    });
    return groups;
  }, [filteredGames]);

  const liveCount = useMemo(() => (games || []).filter(isGameLive).length, [games]);

  const hasActiveFilters = !!sportFilter || !!channelFilter || !!compFilter;
  const toggleFilter = (cat: "sport" | "comp" | "channel") => setOpenFilter((prev) => (prev === cat ? null : cat));
  const clearAll = () => { setSportFilter(null); setChannelFilter(null); setCompFilter(null); setOpenFilter(null); };

  /* Active filter labels for chips */
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (sportFilter) activeChips.push({ key: "sport", label: `${SPORT_EMOJI[sportFilter as SportType] || '⚽'} ${SPORT_LABEL[sportFilter as SportType] || sportFilter}`, onRemove: () => setSportFilter(null) });
  if (compFilter) activeChips.push({ key: "comp", label: `🏆 ${compFilter}`, onRemove: () => setCompFilter(null) });
  if (channelFilter) activeChips.push({ key: "channel", label: `📺 ${channelFilter}`, onRemove: () => setChannelFilter(null) });

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl skeleton-shimmer" />
          <div className="h-5 w-32 rounded skeleton-shimmer" />
          <div className="h-5 w-16 rounded-full skeleton-shimmer" />
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-border/20 bg-card/60">
              <div className="h-[3px] skeleton-shimmer" />
              <div className="p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 rounded skeleton-shimmer" />
                  <div className="h-3 w-12 rounded skeleton-shimmer" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1/3 rounded skeleton-shimmer" />
                  <div className="h-7 w-16 rounded-lg skeleton-shimmer" />
                  <div className="h-4 w-1/3 rounded skeleton-shimmer ml-auto" />
                </div>
                <div className="flex gap-1">
                  <div className="h-5 w-14 rounded-lg skeleton-shimmer" />
                  <div className="h-5 w-14 rounded-lg skeleton-shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!games || games.length === 0) {
    return (
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display text-lg sm:text-xl font-bold text-foreground tracking-tight">Programação</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="p-4 rounded-2xl bg-muted/20 border border-border/20">
            <CalendarOff className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground/60">Nenhum jogo programado para {format(new Date(today + "T12:00:00"), "EEEE, d 'de' MMM", { locale: ptBR })}</p>
          <p className="text-xs text-muted-foreground/40">Confira os destaques da semana enquanto isso</p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("nav-tab-change", { detail: "highlights" }))}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/15 transition-all duration-200 min-h-[44px]"
            aria-label="Ir para a aba Destaques"
          >
            ⭐ Ver destaques
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="esportes" className="space-y-4 w-full min-w-0 overflow-hidden" aria-label="Programação de jogos do dia">
      {/* Header with integrated stats */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20">
          <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
        <h2 className="font-display text-base sm:text-xl font-bold text-foreground tracking-tight">Programação</h2>
        <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 tabular-nums">
          {filteredGames.length} jogos
        </span>
        <span className="text-[10px] text-muted-foreground/60 capitalize font-medium">
          {format(new Date(today + "T12:00:00"), "EEE · d MMM", { locale: ptBR })}
        </span>
        {liveCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] bg-destructive/15 text-destructive px-2 py-0.5 rounded-full font-bold animate-pulse border border-destructive/25">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
            </span>
            {liveCount} ao vivo
          </span>
        )}
      </div>

      {/* Stats bar */}
      <DayStatsBar games={games} />

      {/* Hero — next upcoming game (includes tomorrow's early games) */}
      <NextGameHero games={[...games, ...(tomorrowGames || [])]} />

      {/* Compact accordion filters */}
      <div className="space-y-2">
        {/* Filter category buttons */}
        <div data-horizontal-scroll className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-0.5" role="toolbar" aria-label="Filtros de jogos">
          {availableSports.length > 1 && (
            <button
              onClick={() => toggleFilter("sport")}
              aria-expanded={openFilter === "sport"}
              aria-label={sportFilter ? `Filtro de esporte: ${SPORT_LABEL[sportFilter as SportType]}` : "Filtrar por esporte"}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-xl text-[11px] font-bold transition-all border ${
                openFilter === "sport" || sportFilter
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-card/50 backdrop-blur border-border/20 text-muted-foreground hover:text-foreground hover:border-border/40"
              }`}
            >
              {sportFilter ? `${SPORT_EMOJI[sportFilter as SportType]} ${SPORT_LABEL[sportFilter as SportType]}` : "Esporte"}
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${openFilter === "sport" ? "rotate-180" : ""}`} />
            </button>
          )}
          {availableComps.length > 1 && (
            <button
              onClick={() => toggleFilter("comp")}
              aria-expanded={openFilter === "comp"}
              aria-label={compFilter ? `Filtro de competição: ${compFilter}` : "Filtrar por competição"}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-xl text-[11px] font-bold transition-all border ${
                openFilter === "comp" || compFilter
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-card/50 backdrop-blur border-border/20 text-muted-foreground hover:text-foreground hover:border-border/40"
              }`}
            >
              {compFilter || "Competição"}
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${openFilter === "comp" ? "rotate-180" : ""}`} />
            </button>
          )}
          {availableChannels.length > 1 && (
            <button
              onClick={() => toggleFilter("channel")}
              aria-expanded={openFilter === "channel"}
              aria-label={channelFilter ? `Filtro de canal: ${channelFilter}` : "Filtrar por canal"}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-xl text-[11px] font-bold transition-all border ${
                openFilter === "channel" || channelFilter
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-card/50 backdrop-blur border-border/20 text-muted-foreground hover:text-foreground hover:border-border/40"
              }`}
            >
              {channelFilter ? `📺 ${channelFilter}` : "Canal"}
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${openFilter === "channel" ? "rotate-180" : ""}`} />
            </button>
          )}
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="shrink-0 p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all border border-destructive/20"
              aria-label="Limpar todos os filtros"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Expanded filter pills (accordion — only one open at a time) */}
        <AnimatePresence mode="wait">
          {openFilter === "sport" && availableSports.length > 1 && (
            <motion.div
              key="sport-pills"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div data-horizontal-scroll className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                <button
                  onClick={() => { setSportFilter(null); setOpenFilter(null); }}
                  className={`shrink-0 px-3 py-2 min-h-[44px] rounded-lg text-[10px] font-bold transition-all ${
                    !sportFilter ? "bg-primary/15 text-primary border border-primary/30" : "bg-card/40 border border-border/15 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Todos
                </button>
                {availableSports.map((st) => (
                  <button
                    key={st}
                    onClick={() => { setSportFilter(sportFilter === st ? null : st); setOpenFilter(null); }}
                    className={`shrink-0 px-3 py-2 min-h-[44px] rounded-lg text-[10px] font-bold transition-all ${
                      sportFilter === st ? "bg-primary/15 text-primary border border-primary/30" : "bg-card/40 border border-border/15 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {SPORT_EMOJI[st]} {SPORT_LABEL[st]}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {openFilter === "comp" && availableComps.length > 1 && (
            <motion.div
              key="comp-pills"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div data-horizontal-scroll className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                <button
                  onClick={() => { setCompFilter(null); setOpenFilter(null); }}
                  className={`shrink-0 px-3 py-2 min-h-[44px] rounded-lg text-[10px] font-bold transition-all ${
                    !compFilter ? "bg-primary/15 text-primary border border-primary/30" : "bg-card/40 border border-border/15 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Todas
                </button>
                {availableComps.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => { setCompFilter(compFilter === c.label ? null : c.label); setOpenFilter(null); }}
                    className={`shrink-0 px-3 py-2 min-h-[44px] rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                      compFilter === c.label ? "bg-primary/15 text-primary border border-primary/30" : "bg-card/40 border border-border/15 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.label}
                    <span className="text-[8px] opacity-50 tabular-nums">{c.count}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {openFilter === "channel" && availableChannels.length > 1 && (
            <motion.div
              key="channel-pills"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div data-horizontal-scroll className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                <button
                  onClick={() => { setChannelFilter(null); setOpenFilter(null); }}
                  className={`shrink-0 px-3 py-2 min-h-[44px] rounded-lg text-[10px] font-bold transition-all ${
                    !channelFilter ? "bg-primary/15 text-primary border border-primary/30" : "bg-card/40 border border-border/15 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Todos
                </button>
                {availableChannels.map((ch) => (
                  <button
                    key={ch.label}
                    onClick={() => { setChannelFilter(channelFilter === ch.label ? null : ch.label); setOpenFilter(null); }}
                    className={`shrink-0 px-3 py-2 min-h-[44px] rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                      channelFilter === ch.label ? "bg-primary/15 text-primary border border-primary/30" : "bg-card/40 border border-border/15 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {ch.label}
                    <span className="text-[8px] opacity-50 tabular-nums">{ch.count}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filter chips */}
        {activeChips.length > 0 && openFilter === null && (
          <div className="flex gap-1.5 flex-wrap">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                onClick={chip.onRemove}
                className="flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 rounded-lg px-2 py-1 hover:bg-primary/20 transition-all"
              >
                {chip.label}
                <X className="h-2.5 w-2.5" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grouped games — collapsible periods */}
      <div className="space-y-5">
        {GROUP_ORDER.map((group) => {
          const groupGames = grouped[group];
          if (!groupGames || groupGames.length === 0) return null;
          return <PeriodGroup key={group} group={group} games={groupGames} onPushReminder={handlePushReminder} />;
        })}
      </div>

      {/* Tomorrow's games — collapsible section */}
      {tomorrowGames && tomorrowGames.length > 0 && !hasActiveFilters && (
        <TomorrowSection games={tomorrowGames} onPushReminder={handlePushReminder} />
      )}

      {/* Empty filtered state */}
      <AnimatePresence>
        {filteredGames.length === 0 && hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12 space-y-3"
          >
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/20 inline-block">
              <CalendarOff className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground/60">
              Nenhum jogo{channelFilter ? ` em ${channelFilter}` : ""}{compFilter ? ` de ${compFilter}` : ""}
            </p>
            <button
              onClick={clearAll}
              className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Ver todos os jogos
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
