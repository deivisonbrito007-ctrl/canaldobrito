import logo from "@/assets/logo_brito_solutions_sem_fundo.png";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Tv, Wifi } from "lucide-react";
import { Game } from "@/types/sports";

interface HeaderProps {
  games: Game[];
}

export const Header = ({ games }: HeaderProps) => {
  const today = new Date();
  const liveCount = games.filter((g) => g.status === "live").length;
  const totalCount = games.length;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl">
      <div className="container flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <img src={logo} alt="Brito Solutions TV" className="h-9 sm:h-11 w-auto" />
          <div>
            <h1 className="font-display text-sm sm:text-lg font-bold leading-tight text-foreground">
              Programação Esportiva
            </h1>
            <p className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Tv className="h-3.5 w-3.5" />
              {totalCount} transmiss{totalCount === 1 ? "ão" : "ões"}
            </div>
          )}

          {liveCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-[hsl(var(--live))]/10 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold text-[hsl(var(--live))] glow-live">
              <Wifi className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-pulse-live" />
              {liveCount} ao vivo
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
