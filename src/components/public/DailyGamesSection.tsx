import { useDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Flame, Trophy } from "lucide-react";
import { isGameCurrentlyLive } from "@/lib/gameUtils";

/* ── colour maps ── */
const COMP_COLORS: Record<string, { bg: string; border: string }> = {
  "brasileirão":       { bg: "bg-emerald-500/20", border: "border-emerald-500/50" },
  "brasileirao":       { bg: "bg-emerald-500/20", border: "border-emerald-500/50" },
  "champions league":  { bg: "bg-blue-500/20",    border: "border-blue-500/50" },
  "copa do brasil":    { bg: "bg-yellow-500/20",   border: "border-yellow-500/50" },
  "liga europa":       { bg: "bg-orange-500/20",   border: "border-orange-500/50" },
  "concacaf":          { bg: "bg-purple-500/20",   border: "border-purple-500/50" },
  "la liga":           { bg: "bg-orange-600/20",   border: "border-orange-600/50" },
  "premier league":    { bg: "bg-purple-700/20",   border: "border-purple-700/50" },
  "serie a":           { bg: "bg-blue-600/20",     border: "border-blue-600/50" },
  "libertadores":      { bg: "bg-amber-500/20",    border: "border-amber-500/50" },
  "sul-americana":     { bg: "bg-red-500/20",      border: "border-red-500/50" },
};

const COMP_TOP_COLORS: Record<string, string> = {
  "brasileirão":       "from-emerald-500",
  "brasileirao":       "from-emerald-500",
  "champions league":  "from-blue-500",
  "copa do brasil":    "from-yellow-500",
  "liga europa":       "from-orange-500",
  "concacaf":          "from-purple-500",
  "la liga":           "from-orange-600",
  "premier league":    "from-purple-700",
  "serie a":           "from-blue-600",
  "libertadores":      "from-amber-500",
  "sul-americana":     "from-red-500",
};

const CHANNEL_COLORS: Record<string, string> = {
  "espn":        "bg-red-600/80 text-white",
  "sportv":      "bg-emerald-600/80 text-white",
  "globo":       "bg-foreground/80 text-background",
  "premiere":    "bg-yellow-500/80 text-background",
  "disney+":     "bg-blue-800/80 text-white",
  "max":         "bg-purple-700/80 text-white",
  "tnt":         "bg-blue-600/80 text-white",
  "cazétv":      "bg-lime-500/80 text-background",
  "cazetv":      "bg-lime-500/80 text-background",
  "prime video": "bg-sky-500/80 text-background",
  "band":        "bg-emerald-500/80 text-white",
};

const HIGHLIGHT_COMPS = [
  "champions league", "brasileirão", "brasileirao",
  "libertadores", "copa do brasil", "premier league",
];

const FILTER_CHANNELS = ["ESPN", "Sportv", "Globo", "Premiere", "Disney+", "CazéTV", "TNT"];

const FILTER_COMPS = ["Brasileirão", "Champions League", "Libertadores", "Copa do Brasil", "Premier League"];

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

function getChannelColor(ch: string) {
  return matchKey(ch, CHANNEL_COLORS) ?? "bg-secondary/60 text-muted-foreground";
}

function isHighlight(comp: string) {
  const key = comp.toLowerCase().trim();
  return HIGHLIGHT_COMPS.some((c) => key.includes(c));
}

function isGameLive(game: DailyGame): boolean {
  return isGameCurrentlyLive(game.game_time, game.date);
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

/* ── Game Card ── */
const GameCard = ({ game, index }: { game: DailyGame; index: number }) => {
  const live = isGameLive(game);
  const highlight = isHighlight(game.competition);
  const compColor = getCompColor(game.competition);
  const topGradient = getTopColor(game.competition);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
      className="group"
    >
      <div className={`relative rounded-2xl overflow-hidden border transition-all duration-300
        bg-card/60 backdrop-blur-xl
        ${highlight ? "border-primary/30 shadow-[0_0_20px_-8px_hsl(var(--primary)/0.15)]" : "border-border/20"}
        hover:border-primary/40 hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.2)] hover:-translate-y-0.5`}
      >
        {/* Top accent line */}
        <div className={`h-[3px] bg-gradient-to-r ${topGradient} to-transparent`} />

        <div className="p-4 space-y-3">
          {/* Competition badge + Live badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${compColor.bg} ${compColor.border} text-foreground/80`}>
                {game.competition}
              </span>
              {highlight && <Flame className="h-3.5 w-3.5 text-amber-400 animate-pulse" />}
            </div>
            <div className="flex items-center gap-1.5">
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
            </div>
          </div>

          {/* Competition detail / round */}
          {game.competition_detail && (
            <p className="text-[10px] text-muted-foreground/70 font-medium truncate -mt-1">{game.competition_detail}</p>
          )}

          {/* Teams vs layout */}
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-foreground flex-1 text-left truncate leading-tight">{game.home_team}</p>
            <div className="flex flex-col items-center shrink-0">
              <div className="flex items-center gap-1.5 bg-primary/10 rounded-lg px-3 py-1.5 border border-primary/20">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-bold text-primary tabular-nums tracking-wide">{game.game_time?.slice(0, 5)}</span>
              </div>
              <span className="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-0.5">vs</span>
            </div>
            <p className="text-sm font-bold text-foreground flex-1 text-right truncate leading-tight">{game.away_team}</p>
          </div>

          {/* Channels */}
          {game.channels && game.channels.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {game.channels.slice(0, 4).map((ch, i) => (
                <span key={i} className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${getChannelColor(ch)}`}>
                  {ch}
                </span>
              ))}
              {game.channels.length > 4 && (
                <span className="text-[10px] text-muted-foreground/50 self-center">+{game.channels.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ── Section ── */
export const DailyGamesSection = () => {
  const today = new Date().toISOString().split("T")[0];
  const { data: games, isLoading } = useDailyGames(today);
  const [channelFilter, setChannelFilter] = useState<string | null>(null);
  const [compFilter, setCompFilter] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Re-evaluate live status every 60s
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredGames = useMemo(() => {
    let result = games || [];
    if (channelFilter) {
      result = result.filter((g) =>
        g.channels?.some((ch) => ch.toLowerCase().includes(channelFilter.toLowerCase()))
      );
    }
    if (compFilter) {
      result = result.filter((g) =>
        g.competition.toLowerCase().includes(compFilter.toLowerCase())
      );
    }
    return result;
  }, [games, channelFilter, compFilter]);


  const grouped = useMemo(() => {
    const groups: Record<TimeGroup, typeof filteredGames> = { morning: [], afternoon: [], night: [], dawn: [] };
    filteredGames.forEach((g) => {
      groups[getTimeGroup(g.game_time || "00:00")].push(g);
    });
    return groups;
  }, [filteredGames]);

  if (isLoading) return null;

  if (!games || games.length === 0) {
    return (
      <section className="space-y-5 px-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display text-lg sm:text-xl font-bold text-foreground tracking-tight">
            Programação
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="p-4 rounded-2xl bg-muted/20 border border-border/20">
            <CalendarOff className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground/60">Nenhum jogo programado para hoje</p>
          <p className="text-xs text-muted-foreground/40">Volte mais tarde para conferir a agenda</p>
        </div>
      </section>
    );
  }

  return (
    <section id="esportes" className="space-y-5 px-3 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-display text-lg sm:text-xl font-bold text-foreground tracking-tight">
          Programação
        </h2>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2.5 py-0.5 tabular-nums">
          {filteredGames.length} jogos
        </span>
      </div>

      {/* Competition Filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-3 px-3 sm:-mx-6 sm:px-6">
        <button
          onClick={() => setCompFilter(null)}
          className={`shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold transition-all min-h-[36px] ${
            !compFilter
              ? "bg-primary/15 text-primary border border-primary/30"
              : "bg-card/40 backdrop-blur border border-border/20 text-muted-foreground hover:text-foreground"
          }`}
        >
          Todas
        </button>
        {FILTER_COMPS.map((c) => (
          <button
            key={c}
            onClick={() => setCompFilter(compFilter === c ? null : c)}
            className={`shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold transition-all min-h-[36px] ${
              compFilter === c
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-card/40 backdrop-blur border border-border/20 text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Channel Filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-3 px-3 sm:-mx-6 sm:px-6">
        <button
          onClick={() => setChannelFilter(null)}
          className={`shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold transition-all min-h-[36px] ${
            !channelFilter
              ? "bg-secondary/40 text-foreground border border-border/30"
              : "bg-card/40 backdrop-blur border border-border/20 text-muted-foreground hover:text-foreground"
          }`}
        >
          📺 Todos
        </button>
        {FILTER_CHANNELS.map((ch) => (
          <button
            key={ch}
            onClick={() => setChannelFilter(channelFilter === ch ? null : ch)}
            className={`shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold transition-all min-h-[36px] ${
              channelFilter === ch
                ? "bg-secondary/40 text-foreground border border-border/30"
                : "bg-card/40 backdrop-blur border border-border/20 text-muted-foreground hover:text-foreground"
            }`}
          >
            {ch}
          </button>
        ))}
      </div>

      {/* Grouped games — order: morning → afternoon → night → dawn */}
      <div className="space-y-6">
        {GROUP_ORDER.map((group) => {
          const groupGames = grouped[group];
          if (!groupGames || groupGames.length === 0) return null;
          const meta = GROUP_META[group];
          return (
            <div key={group} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-base">{meta.emoji}</span>
                <span className="text-xs font-bold text-foreground/70 uppercase tracking-widest">{meta.label}</span>
                <div className="flex-1 h-px bg-gradient-to-r from-border/40 to-transparent" />
                <span className="text-[10px] text-muted-foreground/50 tabular-nums">{groupGames.length}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {groupGames.map((game, idx) => (
                  <GameCard key={game.id} game={game} index={idx} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-10">
          <p className="text-sm text-muted-foreground/50">
            Nenhum jogo{channelFilter ? ` em ${channelFilter}` : ""}{compFilter ? ` de ${compFilter}` : ""}
          </p>
        </div>
      )}
    </section>
  );
};
