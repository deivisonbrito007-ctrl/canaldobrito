import logo from "@/assets/logo_brito_solutions_sem_fundo.png";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const PublicHeader = () => {
  const today = new Date();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/10 shadow-[0_1px_4px_hsl(0,0%,0%,0.3)]">
      <div className="flex items-center justify-between px-3 py-1 sm:px-6 sm:py-2">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Brito Solutions" className="h-7 sm:h-10 w-auto" />
          <div className="leading-tight">
            <h1 className="font-display text-xs sm:text-base font-bold text-foreground tracking-tight">
              <span className="text-gradient-primary">Brito Solutions</span>
            </h1>
            <p className="text-[8px] sm:text-[11px] text-muted-foreground/60 capitalize font-medium">
              {format(today, "EEEE, d 'de' MMM", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
