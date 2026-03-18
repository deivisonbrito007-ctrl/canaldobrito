import { Game, SPORTS } from "@/types/sports";
import { LiveBadge } from "./LiveBadge";
import { CountdownTimer } from "./CountdownTimer";
import { TeamLogo } from "./TeamLogo";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tv, Trophy } from "lucide-react";

interface GameCardProps {
  game: Game;
  onClick: (game: Game) => void;
  featured?: boolean;
}

const getChannelStyle = (channel?: string): { bg: string; text: string; border: string } => {
  if (!channel) return { bg: "bg-secondary", text: "text-muted-foreground", border: "border-border" };
  const ch = channel.toLowerCase();
  if (ch.includes("globo")) return { bg: "bg-[hsl(220,15%,15%)]", text: "text-[hsl(0,0%,95%)]", border: "border-[hsl(0,0%,30%)]" };
  if (ch.includes("sportv")) return { bg: "bg-[hsl(145,50%,12%)]", text: "text-[hsl(145,60%,55%)]", border: "border-[hsl(145,40%,25%)]" };
  if (ch.includes("premiere")) return { bg: "bg-[hsl(30,60%,12%)]", text: "text-[hsl(30,90%,60%)]", border: "border-[hsl(30,50%,25%)]" };
  if (ch.includes("espn")) return { bg: "bg-[hsl(0,50%,12%)]", text: "text-[hsl(0,85%,60%)]", border: "border-[hsl(0,40%,25%)]" };
  if (ch.includes("tnt")) return { bg: "bg-[hsl(270,40%,12%)]", text: "text-[hsl(270,60%,65%)]", border: "border-[hsl(270,30%,25%)]" };
  if (ch.includes("band")) return { bg: "bg-[hsl(210,50%,12%)]", text: "text-[hsl(210,80%,60%)]", border: "border-[hsl(210,40%,25%)]" };
  if (ch.includes("record")) return { bg: "bg-[hsl(25,50%,12%)]", text: "text-[hsl(25,90%,60%)]", border: "border-[hsl(25,40%,25%)]" };
  if (ch.includes("paramount")) return { bg: "bg-[hsl(215,50%,12%)]", text: "text-[hsl(215,90%,65%)]", border: "border-[hsl(215,40%,25%)]" };
  if (ch.includes("cazé") || ch.includes("caze")) return { bg: "bg-[hsl(160,40%,12%)]", text: "text-[hsl(160,70%,55%)]", border: "border-[hsl(160,30%,25%)]" };
  if (ch.includes("amazon")) return { bg: "bg-[hsl(200,50%,12%)]", text: "text-[hsl(200,80%,60%)]", border: "border-[hsl(200,40%,25%)]" };
  if (ch.includes("max")) return { bg: "bg-[hsl(260,40%,12%)]", text: "text-[hsl(260,70%,65%)]", border: "border-[hsl(260,30%,25%)]" };
  return { bg: "bg-secondary", text: "text-muted-foreground", border: "border-border/50" };
};

export const GameCard = ({ game, onClick, featured }: GameCardProps) => {
  const sport = SPORTS.find((s) => s.type === game.sport);
  const time = format(new Date(game.startTime), "HH:mm");
  const channelStyle = getChannelStyle(game.broadcastChannel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(game)}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl border transition-all",
        channelStyle.border,
        game.status === "live" && "ring-1 ring-[hsl(var(--live))]/30 glow-live",
        featured && "col-span-full sm:col-span-1"
      )}
    >
      {/* Channel banner */}
      {game.broadcastChannel && (
        <div className={cn("flex items-center gap-1.5 px-3 py-1.5", channelStyle.bg)}>
          <Tv className={cn("h-3.5 w-3.5", channelStyle.text)} />
          <span className={cn("text-[11px] font-bold uppercase tracking-wide", channelStyle.text)}>
            {game.broadcastChannel}
          </span>
          <div className="ml-auto flex items-center">
            {game.status === "live" && <LiveBadge />}
            {game.status === "finished" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <Trophy className="h-3 w-3" /> Encerrado
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="bg-card p-3 sm:p-4">
        {/* League */}
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {game.leagueIcon ? (
              <img src={game.leagueIcon} alt="" className="h-4 w-4 rounded-sm object-contain" loading="lazy" />
            ) : (
              <span className="text-xs">{sport?.icon}</span>
            )}
            <span className="truncate text-[11px] font-medium text-muted-foreground">{game.league}</span>
          </div>
          {!game.broadcastChannel && game.status === "live" && <LiveBadge />}
          {game.status === "scheduled" && <CountdownTimer targetTime={game.startTime} />}
          {!game.broadcastChannel && game.status === "finished" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Trophy className="h-3 w-3" /> Encerrado
            </span>
          )}
        </div>

        {/* Teams row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <TeamLogo name={game.homeTeam.name} logo={game.homeTeam.logo} size="md" />
            <span className={cn("text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2", game.status === "live" && "text-foreground")}>
              {game.homeTeam.name}
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5 px-1">
            {game.status === "scheduled" ? (
              <span className="font-display text-2xl sm:text-3xl font-black text-foreground">{time}</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className={cn("font-display text-2xl sm:text-3xl font-black", game.status === "live" && "text-foreground")}>
                  {game.homeTeam.score ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">×</span>
                <span className={cn("font-display text-2xl sm:text-3xl font-black", game.status === "live" && "text-foreground")}>
                  {game.awayTeam.score ?? 0}
                </span>
              </div>
            )}
            {game.round && (
              <span className="text-[9px] text-muted-foreground/70">{game.round}</span>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <TeamLogo name={game.awayTeam.name} logo={game.awayTeam.logo} size="md" />
            <span className={cn("text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2", game.status === "live" && "text-foreground")}>
              {game.awayTeam.name}
            </span>
          </div>
        </div>
      </div>

      {/* Highlight ribbon */}
      {game.highlight && (
        <div className="absolute -right-8 top-3 rotate-45 bg-primary px-8 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary-foreground">
          Destaque
        </div>
      )}
    </motion.div>
  );
};
