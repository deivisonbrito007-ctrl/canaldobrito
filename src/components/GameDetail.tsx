import { Game, SPORTS } from "@/types/sports";
import { LiveBadge } from "./LiveBadge";
import { CountdownTimer } from "./CountdownTimer";
import { TeamLogo } from "./TeamLogo";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { format } from "date-fns";
import { MapPin, Clock, Trophy, Tv } from "lucide-react";

interface GameDetailProps {
  game: Game | null;
  open: boolean;
  onClose: () => void;
}

const GameDetailContent = ({ game }: { game: Game }) => {
  const sport = SPORTS.find((s) => s.type === game.sport);
  const time = format(new Date(game.startTime), "HH:mm");

  return (
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
      <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 p-4 sm:p-5">
        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <TeamLogo name={game.homeTeam.name} logo={game.homeTeam.logo} size="lg" />
          <span className="font-display text-sm sm:text-base font-bold">{game.homeTeam.name}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          {game.status === "scheduled" ? (
            <span className="font-display text-2xl sm:text-3xl font-black text-muted-foreground">{time}</span>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="font-display text-3xl sm:text-4xl font-black">{game.homeTeam.score ?? 0}</span>
              <span className="text-base text-muted-foreground">×</span>
              <span className="font-display text-3xl sm:text-4xl font-black">{game.awayTeam.score ?? 0}</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <TeamLogo name={game.awayTeam.name} logo={game.awayTeam.logo} size="lg" />
          <span className="font-display text-sm sm:text-base font-bold">{game.awayTeam.name}</span>
        </div>
      </div>

      {/* Broadcast Channel - highlighted */}
      {game.broadcastChannel && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5">
          <Tv className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{game.broadcastChannel}</span>
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
      </div>
    </div>
  );
};

export const GameDetail = ({ game, open, onClose }: GameDetailProps) => {
  const isMobile = useIsMobile();

  if (!game) return null;

  const sport = SPORTS.find((s) => s.type === game.sport);
  const titleContent = (
    <span className="flex items-center gap-2">
      {game.leagueIcon ? (
        <img src={game.leagueIcon} alt="" className="h-5 w-5 rounded-sm object-contain" />
      ) : (
        <span>{sport?.icon}</span>
      )}
      {game.league}
    </span>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onClose}>
        <DrawerContent className="border-border/50 bg-card px-4 pb-6">
          <DrawerHeader className="px-0">
            <DrawerTitle className="font-display text-left">{titleContent}</DrawerTitle>
          </DrawerHeader>
          <GameDetailContent game={game} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-border/50 bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{titleContent}</DialogTitle>
        </DialogHeader>
        <GameDetailContent game={game} />
      </DialogContent>
    </Dialog>
  );
};
