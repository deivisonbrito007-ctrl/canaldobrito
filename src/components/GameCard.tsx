import { Game, SPORTS } from "@/types/sports";
import { LiveBadge } from "./LiveBadge";
import { CountdownTimer } from "./CountdownTimer";
import { TeamLogo } from "./TeamLogo";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trophy, Tv } from "lucide-react";

interface GameCardProps {
  game: Game;
  onClick: (game: Game) => void;
  featured?: boolean;
}

export const GameCard = ({ game, onClick, featured }: GameCardProps) => {
  const sport = SPORTS.find((s) => s.type === game.sport);
  const time = format(new Date(game.startTime), "HH:mm");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(game)}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl border bg-card p-3 sm:p-4 transition-all hover:border-primary/30",
        game.status === "live" && "border-live/40 ring-1 ring-live/20 glow-live",
        featured && "col-span-full sm:col-span-1"
      )}
    >
      {/* League & Status */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {game.leagueIcon ? (
            <img src={game.leagueIcon} alt="" className="h-4 w-4 rounded-sm object-contain" loading="lazy" />
          ) : (
            <span className="text-xs">{sport?.icon}</span>
          )}
          <span className="truncate text-[11px] font-medium text-muted-foreground">{game.league}</span>
        </div>
        {game.status === "live" && <LiveBadge />}
        {game.status === "scheduled" && <CountdownTimer targetTime={game.startTime} />}
        {game.status === "finished" && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            <Trophy className="h-3 w-3" />
            Encerrado
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-2">
        {/* Home */}
        <div className="flex flex-1 flex-col items-center gap-1 text-center">
          <TeamLogo name={game.homeTeam.name} logo={game.homeTeam.logo} size="md" />
          <span className={cn("text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2", game.status === "live" && "text-foreground")}>
            {game.homeTeam.name}
          </span>
        </div>

        {/* Score or Time */}
        <div className="flex flex-col items-center gap-0.5">
          {game.status === "scheduled" ? (
            <span className="font-display text-lg sm:text-xl font-bold text-muted-foreground">{time}</span>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className={cn("font-display text-xl sm:text-2xl font-black", game.status === "live" && "text-foreground")}>
                {game.homeTeam.score ?? 0}
              </span>
              <span className="text-xs text-muted-foreground">×</span>
              <span className={cn("font-display text-xl sm:text-2xl font-black", game.status === "live" && "text-foreground")}>
                {game.awayTeam.score ?? 0}
              </span>
            </div>
          )}
          {game.round && (
            <span className="text-[9px] text-muted-foreground">{game.round}</span>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-1 flex-col items-center gap-1 text-center">
          <TeamLogo name={game.awayTeam.name} logo={game.awayTeam.logo} size="md" />
          <span className={cn("text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2", game.status === "live" && "text-foreground")}>
            {game.awayTeam.name}
          </span>
        </div>
      </div>

      {/* Channel */}
      {game.broadcastChannel && (
        <div className="mt-2 flex items-center justify-center gap-1 rounded-md bg-secondary/60 px-2 py-1">
          <Tv className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-medium text-muted-foreground">{game.broadcastChannel}</span>
        </div>
      )}

      {/* Highlight ribbon */}
      {game.highlight && (
        <div className="absolute -right-8 top-3 rotate-45 bg-primary px-8 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary-foreground">
          Destaque
        </div>
      )}
    </motion.div>
  );
};
