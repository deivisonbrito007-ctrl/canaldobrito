import logo from "@/assets/logo_brito_solutions_sem_fundo.png";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const PublicHeader = () => {
  const today = new Date();

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-2xl border-b border-border/20">
      <div className="flex items-center justify-between px-3 py-2 sm:px-6 sm:py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-primary/15 blur-md" />
            <img src={logo} alt="Brito Solutions" className="relative h-9 sm:h-11 w-auto" />
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-sm sm:text-lg font-bold text-foreground tracking-tight">
              <span className="text-gradient-primary">Brito Solutions</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground capitalize">
              {format(today, "EEEE, d MMM", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-[10px] sm:text-xs font-bold text-primary">AO VIVO</span>
        </div>
      </div>
    </header>
  );
};