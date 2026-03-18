import logo from "@/assets/logo_brito_solutions_sem_fundo.png";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Wifi } from "lucide-react";
import { Game } from "@/types/sports";

interface HeaderProps {
  games: Game[];
}

export const Header = ({ games }: HeaderProps) => {
  const today = new Date();
  const liveCount = games.filter((g) => g.status === "live").length;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex items-center justify-between py-2 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src={logo} alt="Brito Solutions TV" className="h-8 sm:h-10 w-auto" />
          <div>
            <h1 className="hidden sm:block font-display text-lg font-bold leading-tight text-foreground">
              Agenda Brito Solutions TV
            </h1>
            <p className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>

        {liveCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-live/10 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-live glow-live">
            <Wifi className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-pulse-live" />
            {liveCount} ao vivo
          </div>
        )}
      </div>
    </header>
  );
};
