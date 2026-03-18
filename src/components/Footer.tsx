import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Settings, Lock } from "lucide-react";

export const Footer = () => {
  const { isAdmin } = useAuth();

  return (
    <footer className="border-t border-border/30 py-4 sm:py-6">
      <div className="container px-3 sm:px-4 text-center">
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          Atualizado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
        <p className="mt-1 font-display text-xs sm:text-sm font-semibold text-muted-foreground/60">
          Powered by <span className="text-gradient-primary">Brito Solutions TV</span> ⚡
        </p>
        {isAdmin ? (
          <a
            href="/admin"
            className="mt-2 inline-flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground/40 transition-colors hover:text-primary"
          >
            <Settings className="h-3 w-3" />
            Painel Admin
          </a>
        ) : (
          <a
            href="/login"
            className="mt-2 inline-flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground/30 transition-colors hover:text-muted-foreground/60"
          >
            <Lock className="h-3 w-3" />
            Admin
          </a>
        )}
      </div>
    </footer>
  );
};
