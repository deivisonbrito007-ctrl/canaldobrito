import logo from "@/assets/logo_brito_solutions_sem_fundo.png";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "lucide-react";

export const PublicHeader = () => {
  const today = new Date();

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl">
      <div className="container flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <img src={logo} alt="Brito Solutions" className="h-9 sm:h-11 w-auto" />
          <div>
            <h1 className="font-display text-sm sm:text-lg font-bold leading-tight text-foreground">
              Programação do Dia
            </h1>
            <p className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
