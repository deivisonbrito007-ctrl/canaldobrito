import { useDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Flame } from "lucide-react";

const COMP_COLORS: Record<string, string> = {
  "brasileirão": "bg-emerald-500/80",
  "brasileirao": "bg-emerald-500/80",
  "champions league": "bg-blue-800/80",
  "copa do brasil": "bg-yellow-500/80",
  "liga europa": "bg-orange-500/80",
  "concacaf": "bg-purple-600/80",
  "campeonato turco": "bg-destructive/80",
  "la liga": "bg-orange-600/80",
  "premier league": "bg-purple-700/80",
  "serie a": "bg-blue-600/80",
  "libertadores": "bg-amber-500/80",
  "sul-americana": "bg-destructive/60",
};

const CHANNEL_COLORS: Record<string, string> = {
  "espn": "bg-destructive/80 text-primary-foreground",
  "sportv": "bg-emerald-600 text-primary-foreground",
  "globo": "bg-foreground/90 text-background",
  "premiere": "bg-yellow-500 text-background",
  "disney+": "bg-blue-900 text-primary-foreground",
  "hbo max": "bg-purple-700 text-primary-foreground",
  "max": "bg-purple-700 text-primary-foreground",
  "tnt": "bg-blue-600 text-primary-foreground",
  "cazétv": "bg-lime-500 text-background",
  "cazetv": "bg-lime-500 text-background",
  "prime video": "bg-sky-400 text-background",
  "record": "bg-blue-900 text-primary-foreground",
  "band": "bg-emerald-500 text-primary-foreground",
};

const HIGHLIGHT_COMPS = [
  "champions league", "brasileirão", "brasileirao",
  "libertadores", "copa do brasil", "premier league",
];

const FILTER_CHANNELS = ["ESPN", "Sportv", "Globo", "Premiere", "Disney+", "HBO Max", "CazéTV", "TNT"];

function getCompColor(comp: string) {
  const key = comp.toLowerCase().trim();
  for (const [k, v] of Object.entries(COMP_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-muted";
}

function getChannelColor(channel: string) {
  const key = channel.toLowerCase().trim();
  for (const [k, v] of Object.entries(CHANNEL_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-secondary text-muted-foreground";
}

function isHighlight(comp: string) {
  const key = comp.toLowerCase().trim();
  return HIGHLIGHT_COMPS.some((c) => key.includes(c));
}

function isGameLive(game: DailyGame): boolean {
  if (game.is_live) return true;
  const now = new Date();
  const [h, m] = (game.game_time || "00:00").split(":").map(Number);
  const start = new Date();
  start.setHours(h, m, 0, 0);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return now >= start && now <= end;
}

function getTimeGroup(time: string): "morning" | "afternoon" | "night" {
  const h = parseInt(time.split(":")[0], 10);
  if (h < 13) return "morning";
  if (h < 18) return "afternoon";
  return "night";
}

const GROUP_LABELS = {
  morning: "🌅 Manhã (até 13h)",
  afternoon: "☀️ Tarde (13h – 18h)",
  night: "🌙 Noite (18h+)",
};

const GameCard = ({ game, index }: { game: DailyGame; index: number }) => {
  const highlight = isHighlight(game.competition);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <div
        className={`rounded-2xl glass-card p-4 transition-all duration-300 border border-border/20 ${
          highlight ? "border-primary/20" : ""
        }`}
      >
        {/* Competition + highlight badge */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold text-primary-foreground px-2 py-0.5 rounded-lg ${getCompColor(game.competition)}`}>
              {game.competition}
            </span>
            {highlight && <Flame className="h-3 w-3 text-amber-400" />}
          </div>
          {game.is_womens && (
            <span className="text-[10px] bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-lg font-bold">
              ♀ Feminino
            </span>
          )}
        </div>

        {/* Teams + time */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-foreground flex-1 text-left truncate">
            {game.home_team}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-base font-bold text-primary tabular-nums">
              {game.game_time?.slice(0, 5)}
            </span>
          </div>
          <p className="text-sm font-bold text-foreground flex-1 text-right truncate">
            {game.away_team}
          </p>
        </div>

        {/* Competition detail */}
        {game.competition_detail && (
          <p className="text-[11px] text-muted-foreground mt-2">
            {game.competition_detail}
          </p>
        )}

        {/* Channels */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {game.channels?.map((ch, i) => (
            <span
              key={i}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${getChannelColor(ch)}`}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export const DailyGamesSection = () => {
  const today = new Date().toISOString().split("T")[0];
  const { data: games, isLoading } = useDailyGames(today);
  const [channelFilter, setChannelFilter] = useState<string | null>(null);

  // Only upcoming games (not live)
  const upcomingGames = useMemo(() => {
    if (!games) return [];
    return games.filter((g) => !isGameLive(g));
  }, [games]);

  const filteredGames = useMemo(() => {
    if (!channelFilter) return upcomingGames;
    return upcomingGames.filter((g) =>
      g.channels?.some((ch) => ch.toLowerCase().includes(channelFilter.toLowerCase()))
    );
  }, [upcomingGames, channelFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filteredGames> = { morning: [], afternoon: [], night: [] };
    filteredGames.forEach((g) => {
      const group = getTimeGroup(g.game_time || "00:00");
      groups[group].push(g);
    });
    return groups;
  }, [filteredGames]);

  if (isLoading || !games || games.length === 0) return null;

  return (
    <section id="esportes" className="space-y-5 px-4 sm:px-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">📋</span>
          <h2 className="font-display text-lg font-bold text-foreground tracking-tight">
            Programação de Hoje
          </h2>
          <span className="text-[10px] text-muted-foreground bg-secondary/60 rounded-full px-2 py-0.5 font-medium">
            {filteredGames.length}
          </span>
        </div>

        {/* Channel Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
          <button
            onClick={() => setChannelFilter(null)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !channelFilter
                ? "bg-primary/15 text-primary border border-primary/30"
                : "glass-panel text-muted-foreground hover:text-foreground"
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
                  : "glass-panel text-muted-foreground hover:text-foreground"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>

        {/* Grouped games */}
        {(["morning", "afternoon", "night"] as const).map((group) => {
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
                  <GameCard key={game.id} game={game} index={idx} />
                ))}
              </div>
            </div>
          );
        })}

        {filteredGames.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground/60">
              Nenhum jogo programado{channelFilter ? ` para ${channelFilter}` : ""}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
