import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Settings } from "lucide-react";

export const Footer = () => {
  const { isAdmin } = useAuth();

  return (
    <footer className="border-t border-border/30 py-6">
      <div className="container text-center">
        <p className="text-xs text-muted-foreground">
          Atualizado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
        <p className="mt-1 font-display text-sm font-semibold text-muted-foreground/60">
          Powered by <span className="text-gradient-primary">Brito Solutions TV</span> ⚡
        </p>
        {isAdmin && (
          <a
            href="/admin"
            className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground/40 transition-colors hover:text-primary"
          >
            <Settings className="h-3 w-3" />
            Painel Admin
          </a>
        )}
      </div>
    </footer>
  );
};
