import { Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const AppNavbar = () => {
  const today = new Date();

  return (
    <header className="sticky top-0 z-50 glass-nav border-b border-border/10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Logo icon */}
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-lg">
            <span className="text-white text-sm font-bold">▶</span>
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-lg tracking-[3px] text-primary">
              BRITO SOLUTIONS
            </h1>
            <p className="text-[10px] text-muted-foreground capitalize font-body font-medium">
              {format(today, "EEEE · d 'de' MMM", { locale: ptBR })}
            </p>
          </div>
        </div>

        <button className="h-10 w-10 rounded-full border border-border/30 flex items-center justify-center touch-target transition-colors hover:bg-card">
          <Search className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
};
