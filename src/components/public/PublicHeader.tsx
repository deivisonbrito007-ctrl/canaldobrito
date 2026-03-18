import logo from "@/assets/logo_brito_solutions_sem_fundo.png";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const PublicHeader = () => {
  const today = new Date();

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/10 shadow-[0_1px_8px_hsl(0,0%,0%,0.25)]">
      <div className="flex items-center justify-between px-3 py-1.5 sm:px-6 sm:py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-primary/10 blur-md" />
            <img src={logo} alt="Brito Solutions" className="relative h-8 sm:h-11 w-auto" />
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-sm sm:text-lg font-bold text-foreground tracking-tight">
              <span className="text-gradient-primary">Brito Solutions</span>
            </h1>
            <p className="text-[9px] sm:text-xs text-muted-foreground/70 capitalize font-medium">
              {format(today, "EEEE, d 'de' MMM", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
