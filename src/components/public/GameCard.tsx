import type { Game } from "@/hooks/useGames";
import { Badge } from "@/components/ui/badge";
import { Tv, Shield } from "lucide-react";
import { useState } from "react";

const competitionColors: Record<string, string> = {
  "Brasileirão": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Champions League": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Copa do Brasil": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Libertadores": "bg-green-700/20 text-green-400 border-green-700/30",
  "Premier League": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "La Liga": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Serie A": "bg-sky-500/20 text-sky-400 border-sky-500/30",
};

const getCompetitionClass = (comp: string) => {
  for (const [key, cls] of Object.entries(competitionColors)) {
    if (comp.toLowerCase().includes(key.toLowerCase())) return cls;
  }
  return "bg-muted text-muted-foreground border-border";
};

const isLive = (date: string, time: string): boolean => {
  const now = new Date();
  const [h, m] = time.split(":").map(Number);
  const gameStart = new Date(date + "T" + time);
  // Fix timezone: game date+time is in local time
  gameStart.setHours(h, m, 0, 0);
  const gameEnd = new Date(gameStart.getTime() + 2 * 60 * 60 * 1000);
  return now >= gameStart && now <= gameEnd;
};

export const GameCard = ({ game }: { game: Game }) => {
  const live = isLive(game.date, game.time);
  const [homeErr, setHomeErr] = useState(false);
  const [awayErr, setAwayErr] = useState(false);

  const TeamLogo = ({ src, error, onError }: { src: string | null; error: boolean; onError: () => void }) => {
    if (!src || error) {
      return (
        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
          <Shield className="h-5 w-5 text-muted-foreground" />
        </div>
      );
    }
    return (
      <img
        src={src}
        alt=""
        className="h-10 w-10 rounded-full object-contain bg-secondary/50 p-0.5"
        loading="lazy"
        onError={onError}
      />
    );
  };

  return (
    <div className="relative rounded-xl border border-border/50 bg-card p-3 sm:p-4 hover:border-primary/30 transition-colors">
      {live && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 animate-pulse-live">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-[10px] font-bold text-red-400 uppercase">Ao Vivo</span>
        </div>
      )}

      {game.competition && (
        <Badge className={`mb-2 text-[10px] border ${getCompetitionClass(game.competition)}`}>
          {game.competition}
        </Badge>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TeamLogo src={game.home_logo} error={homeErr} onError={() => setHomeErr(true)} />
          <span className="text-xs sm:text-sm font-semibold text-foreground truncate">{game.home_team}</span>
        </div>

        <div className="flex flex-col items-center px-2 shrink-0">
          <span className="text-lg sm:text-xl font-bold text-primary font-display">{game.time?.slice(0, 5)}</span>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">vs</span>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-xs sm:text-sm font-semibold text-foreground truncate text-right">{game.away_team}</span>
          <TeamLogo src={game.away_logo} error={awayErr} onError={() => setAwayErr(true)} />
        </div>
      </div>

      {game.channel && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
          <Tv className="h-3 w-3" />
          {game.channel}
        </div>
      )}
    </div>
  );
};
