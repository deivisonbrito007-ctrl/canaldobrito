import { Game, SPORTS } from "@/types/sports";
import { LiveBadge } from "./LiveBadge";
import { CountdownTimer } from "./CountdownTimer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Clock, Trophy, Tv } from "lucide-react";

interface GameDetailProps {
  game: Game | null;
  open: boolean;
  onClose: () => void;
}

export const GameDetail = ({ game, open, onClose }: GameDetailProps) => {
  if (!game) return null;

  const sport = SPORTS.find((s) => s.type === game.sport);
  const time = format(new Date(game.startTime), "HH:mm");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-border/50 bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <span>{sport?.icon}</span>
            {game.league}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex justify-center">
            {game.status === "live" && <LiveBadge />}
            {game.status === "scheduled" && <CountdownTimer targetTime={game.startTime} />}
            {game.status === "finished" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                <Trophy className="h-4 w-4" />
                Encerrado
              </span>
            )}
          </div>

          {/* Matchup */}
          <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary/50 p-5">
            <div className="flex flex-1 flex-col items-center gap-2 text-center">
              <span className="text-4xl">{sport?.icon}</span>
              <span className="font-display text-base font-bold">{game.homeTeam.name}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              {game.status === "scheduled" ? (
                <span className="font-display text-3xl font-black text-muted-foreground">{time}</span>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="font-display text-4xl font-black">{game.homeTeam.score ?? 0}</span>
                  <span className="text-lg text-muted-foreground">×</span>
                  <span className="font-display text-4xl font-black">{game.awayTeam.score ?? 0}</span>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col items-center gap-2 text-center">
              <span className="text-4xl">{sport?.icon}</span>
              <span className="font-display text-base font-bold">{game.awayTeam.name}</span>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-secondary/30 px-3 py-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{time}</span>
            </div>
            {game.venue && (
              <div className="flex items-center gap-2 rounded-lg bg-secondary/30 px-3 py-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{game.venue}</span>
              </div>
            )}
            {game.round && (
              <div className="flex items-center gap-2 rounded-lg bg-secondary/30 px-3 py-2 text-sm">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span>{game.round}</span>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-lg bg-secondary/30 px-3 py-2 text-sm">
              <Tv className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{game.apiSource || "manual"}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
