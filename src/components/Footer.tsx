import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Footer = () => {
  return (
    <footer className="border-t border-border/30 py-6">
      <div className="container text-center">
        <p className="text-xs text-muted-foreground">
          Atualizado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
        <p className="mt-1 font-display text-sm font-semibold text-muted-foreground/60">
          Powered by <span className="text-gradient-primary">Brito Solutions TV</span> ⚡
        </p>
      </div>
    </footer>
  );
};
