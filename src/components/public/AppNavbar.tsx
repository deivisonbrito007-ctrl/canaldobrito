import { Search, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logo from "@/assets/logo_brito_solutions_sem_fundo.png";

export const AppNavbar = () => {
  const today = new Date();

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Brito Solutions" className="h-10 w-10 rounded-xl object-contain glow-primary-subtle" />
          <div className="leading-tight">
            <h1 className="font-display text-lg tracking-[3px] text-gradient-primary">
              BRITO SOLUTIONS
            </h1>
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground capitalize font-body font-medium">
              <CalendarDays className="h-3 w-3" />
              {format(today, "EEEE · d 'de' MMM", { locale: ptBR })}
            </p>
          </div>
        </div>

        <button className="h-10 w-10 rounded-full border border-border/30 flex items-center justify-center touch-target transition-all hover:border-primary/30 hover:glow-primary-subtle">
          <Search className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <div className="section-divider" />
    </header>
  );
};
