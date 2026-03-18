import { useDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";

// Competition colors
const COMP_COLORS: Record<string, string> = {
  "brasileirão": "bg-emerald-500/80",
  "brasileirao": "bg-emerald-500/80",
  "champions league": "bg-blue-800/80",
  "copa do brasil": "bg-yellow-500/80",
  "liga europa": "bg-orange-500/80",
  "concacaf": "bg-purple-600/80",
  "campeonato turco": "bg-red-600/80",
  "copa do rei": "bg-amber-600/80",
  "la liga": "bg-orange-600/80",
  "premier league": "bg-purple-700/80",
  "serie a": "bg-blue-600/80",
  "ligue 1": "bg-blue-500/80",
  "bundesliga": "bg-red-500/80",
  "libertadores": "bg-amber-500/80",
  "sul-americana": "bg-red-400/80",
  "copa america": "bg-blue-500/80",
};

const CHANNEL_COLORS: Record<string, string> = {
  "espn": "bg-red-700 text-white",
  "espn2": "bg-red-700 text-white",
  "espn4": "bg-red-700 text-white",
  "sportv": "bg-emerald-600 text-white",
  "sportv2": "bg-emerald-600 text-white",
  "sportv3": "bg-emerald-600 text-white",
  "globo": "bg-white/90 text-gray-900",
  "premiere": "bg-yellow-500 text-gray-900",
  "disney+": "bg-blue-900 text-white",
  "hbo max": "bg-purple-700 text-white",
  "max": "bg-purple-700 text-white",
  "tnt": "bg-blue-600 text-white",
  "tnt sports": "bg-blue-600 text-white",
  "cazétv": "bg-lime-500 text-gray-900",
  "cazetv": "bg-lime-500 text-gray-900",
  "record": "bg-blue-900 text-white",
  "band": "bg-emerald-500 text-white",
  "bandsports": "bg-emerald-500 text-white",
  "prime video": "bg-sky-400 text-gray-900",
  "canal goat": "bg-gray-900 text-white",
  "star+": "bg-blue-900 text-white",
};

const FILTER_CHANNELS = ["ESPN", "Sportv", "Globo", "Premiere", "Disney+", "HBO Max", "CazéTV", "TNT"];

function getCompColor(comp: string) {
  const key = comp.toLowerCase().trim();
  for (const [k, v] of Object.entries(COMP_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-gray-600/80";
}

function getChannelColor(channel: string) {
  const key = channel.toLowerCase().trim();
  for (const [k, v] of Object.entries(CHANNEL_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-secondary text-foreground/70";
}

function isGameLive(game: DailyGame): boolean {
  if (game.is_live) return true;
  const now = new Date();
  const [h, m] = (game.game_time || "00:00").split(":").map(Number);
  const gameStart = new Date();
  gameStart.setHours(h, m, 0, 0);
  const gameEnd = new Date(gameStart.getTime() + 2 * 60 * 60 * 1000);
  return now >= gameStart && now <= gameEnd;
}

function getTimeGroup(time: string): "morning" | "evening" | "night" {
  const h = parseInt(time.split(":")[0], 10);
  if (h < 17) return "morning";
  if (h < 21) return "evening";
  return "night";
}

const GROUP_LABELS = {
  morning: "🌅 Manhã/Tarde (até 17h)",
  evening: "🌆 Noite (17h - 21h)",
  night: "🌙 Madrugada (21h+)",
};

const GameCard = ({ game, index, isLive }: { game: DailyGame; index: number; isLive: boolean }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
      onClick={() => setExpanded(!expanded)}
      className="cursor-pointer"
    >
      <div
        className={`rounded-2xl glass-card p-4 transition-all duration-300 ${
          isLive
            ? "animate-border-pulse-live border-2"
            : "border border-border/20"
        }`}
      >
        {/* Competition badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-lg ${getCompColor(game.competition)}`}>
            {game.competition || "Jogo"}
          </span>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              AO VIVO
            </span>
          )}
          {game.is_womens && (
            <span className="text-[10px] bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-lg font-bold">
              Feminino
            </span>
          )}
        </div>

        {/* Teams and time */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-foreground flex-1 text-left truncate">
            {game.home_team}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {isLive ? (
              <Clock className="h-3.5 w-3.5 text-red-400 animate-spin-slow" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-primary" />
            )}
            <span className={`text-base font-bold ${isLive ? "text-red-400" : "text-primary"}`}>
              {game.game_time?.slice(0, 5)}
            </span>
          </div>
          <p className="text-sm font-bold text-foreground flex-1 text-right truncate">
            {game.away_team}
          </p>
        </div>

        {/* Channels preview */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {(expanded ? game.channels : game.channels?.slice(0, 3))?.map((ch, i) => (
            <span
              key={i}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${getChannelColor(ch)}`}
            >
              {ch}
            </span>
          ))}
          {!expanded && game.channels && game.channels.length > 3 && (
            <span className="text-[10px] text-muted-foreground/50 flex items-center">
              +{game.channels.length - 3}
            </span>
          )}
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border/20">
                {game.competition_detail && (
                  <p className="text-[11px] text-muted-foreground">
                    {game.competition} · {game.competition_detail}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground/50 mt-1">
                  📅 {game.date}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand indicator */}
        <div className="flex justify-center mt-2">
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/30" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/30" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const DailyGamesSection = () => {
  const today = new Date().toISOString().split("T")[0];
  const { data: games, isLoading } = useDailyGames(today);
  const [channelFilter, setChannelFilter] = useState<string | null>(null);
  const confettiFired = useRef(false);

  const enrichedGames = useMemo(() => {
    if (!games) return [];
    return games.map((g) => ({ ...g, _isLive: isGameLive(g) }));
  }, [games]);

  const filteredGames = useMemo(() => {
    if (!channelFilter) return enrichedGames;
    return enrichedGames.filter((g) =>
      g.channels?.some((ch) => ch.toLowerCase().includes(channelFilter.toLowerCase()))
    );
  }, [enrichedGames, channelFilter]);

  const liveGames = filteredGames.filter((g) => g._isLive);
  const upcomingGames = filteredGames.filter((g) => !g._isLive);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof upcomingGames> = { morning: [], evening: [], night: [] };
    upcomingGames.forEach((g) => {
      const group = getTimeGroup(g.game_time || "00:00");
      groups[group].push(g);
    });
    return groups;
  }, [upcomingGames]);

  // Confetti on first live game
  useEffect(() => {
    if (liveGames.length > 0 && !confettiFired.current) {
      confettiFired.current = true;
      // Simple CSS-based celebration - no external dependency needed
    }
  }, [liveGames.length]);

  if (isLoading || !games || games.length === 0) return null;

  return (
    <section id="esportes" className="space-y-5 px-4 sm:px-6">
      {/* Live Section */}
      {liveGames.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
              Ao Vivo Agora
            </h2>
            <span className="text-[10px] bg-red-500/20 text-red-400 rounded-full px-2 py-0.5 font-bold">
              {liveGames.length}
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2">
            {liveGames.map((game, idx) => (
              <div key={game.id} className="min-w-[280px] sm:min-w-[320px] flex-shrink-0">
                <GameCard game={game} index={idx} isLive />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Schedule */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📋</span>
            <h2 className="font-display text-base sm:text-lg font-bold text-foreground tracking-tight">
              Programação de Hoje
            </h2>
            <span className="text-[10px] text-muted-foreground/50 bg-secondary/60 rounded-full px-2 py-0.5 font-medium">
              {filteredGames.length}
            </span>
          </div>
        </div>

        {/* Channel Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 sticky top-[52px] z-30 bg-background/90 backdrop-blur-lg py-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
          <button
            onClick={() => setChannelFilter(null)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !channelFilter
                ? "bg-primary/15 text-primary border border-primary/30"
                : "glass-panel text-muted-foreground/70 hover:text-foreground"
            }`}
          >
            Todos
          </button>
          {FILTER_CHANNELS.map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(channelFilter === ch ? null : ch)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                channelFilter === ch
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "glass-panel text-muted-foreground/70 hover:text-foreground"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>

        {/* Grouped games */}
        {(["morning", "evening", "night"] as const).map((group) => {
          const groupGames = grouped[group];
          if (!groupGames || groupGames.length === 0) return null;
          return (
            <div key={group} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground/60">
                  {GROUP_LABELS[group]}
                </span>
                <div className="flex-1 h-px bg-border/20" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {groupGames.map((game, idx) => (
                  <GameCard key={game.id} game={game} index={idx} isLive={game._isLive} />
                ))}
              </div>
            </div>
          );
        })}

        {filteredGames.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground/60">
              Nenhum jogo encontrado{channelFilter ? ` para ${channelFilter}` : ""}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
