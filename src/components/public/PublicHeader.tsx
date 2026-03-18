import logo from "@/assets/logo_brito_solutions_sem_fundo.png";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Tv } from "lucide-react";

export const PublicHeader = () => {
  const today = new Date();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/30">
      <div className="container flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-primary/20 blur-md" />
            <img src={logo} alt="Brito Solutions" className="relative h-10 sm:h-12 w-auto drop-shadow-lg" />
          </div>
          <div>
            <h1 className="font-display text-base sm:text-xl font-bold leading-tight text-foreground tracking-tight">
              Agenda <span className="text-gradient-primary">Brito Solutions</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
                <Calendar className="h-3 w-3 text-primary" />
                <span className="text-[10px] sm:text-xs font-medium text-primary capitalize">
                  {format(today, "EEEE", { locale: ptBR })}
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {format(today, "d 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1.5">
          <Tv className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] sm:text-xs font-semibold text-primary hidden sm:inline">TV</span>
        </div>
      </div>
    </header>
  );
};