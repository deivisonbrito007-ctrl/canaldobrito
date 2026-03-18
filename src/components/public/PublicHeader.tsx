import logo from "@/assets/logo_brito_solutions_sem_fundo.png";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const PublicHeader = () => {
  const today = new Date();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/10 shadow-[0_1px_12px_hsl(0,0%,0%,0.3)]">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="flex items-center justify-between px-4 py-2.5 sm:px-6 sm:py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1.5 rounded-full bg-primary/10 blur-lg" />
            <img src={logo} alt="Brito Solutions" className="relative h-10 sm:h-12 w-auto" />
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-base sm:text-lg font-bold text-foreground tracking-tight">
              <span className="text-gradient-primary">Brito Solutions</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground/70 capitalize font-medium">
              {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-live/10 border border-live/20 px-2.5 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-live glow-live" />
          </span>
          <span className="text-[10px] sm:text-xs font-bold text-live tracking-wide">AO VIVO</span>
        </div>
      </div>
    </header>
  );
};
