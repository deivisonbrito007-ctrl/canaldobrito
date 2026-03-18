import { Game, SPORTS } from "@/types/sports";
import { LiveBadge } from "./LiveBadge";
import { CountdownTimer } from "./CountdownTimer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

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
        "group relative cursor-pointer overflow-hidden rounded-xl border bg-card p-4 transition-all hover:border-primary/30",
        game.status === "live" && "border-live/30 glow-live",
        featured && "col-span-full sm:col-span-1"
      )}
    >
      {/* League & Sport badge */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{sport?.icon}</span>
          <span className="text-xs font-medium text-muted-foreground">{game.league}</span>
        </div>
        {game.status === "live" && <LiveBadge />}
        {game.status === "scheduled" && <CountdownTimer targetTime={game.startTime} />}
        {game.status === "finished" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            <Trophy className="h-3 w-3" />
            Encerrado
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-3">
        {/* Home */}
        <div className="flex flex-1 flex-col items-center gap-1 text-center">
          <span className="text-2xl">{sport?.icon}</span>
          <span className={cn("text-sm font-semibold leading-tight", game.status === "live" && "text-foreground")}>
            {game.homeTeam.name}
          </span>
        </div>

        {/* Score or Time */}
        <div className="flex flex-col items-center gap-0.5">
          {game.status === "scheduled" ? (
            <span className="font-display text-xl font-bold text-muted-foreground">{time}</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className={cn("font-display text-2xl font-black", game.status === "live" && "text-foreground")}>
                {game.homeTeam.score ?? 0}
              </span>
              <span className="text-sm text-muted-foreground">×</span>
              <span className={cn("font-display text-2xl font-black", game.status === "live" && "text-foreground")}>
                {game.awayTeam.score ?? 0}
              </span>
            </div>
          )}
          {game.round && (
            <span className="text-[10px] text-muted-foreground">{game.round}</span>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-1 flex-col items-center gap-1 text-center">
          <span className="text-2xl">{sport?.icon}</span>
          <span className={cn("text-sm font-semibold leading-tight", game.status === "live" && "text-foreground")}>
            {game.awayTeam.name}
          </span>
        </div>
      </div>

      {/* Venue */}
      {game.venue && (
        <p className="mt-3 text-center text-[11px] text-muted-foreground/70">{game.venue}</p>
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
