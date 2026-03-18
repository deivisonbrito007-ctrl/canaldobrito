import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Settings, Lock, Zap } from "lucide-react";
import logo from "@/assets/logo_brito_solutions_sem_fundo.png";

export const Footer = () => {
  const { isAdmin } = useAuth();

  return (
    <footer className="border-t border-border/30 bg-card/50 backdrop-blur-sm">
      <div className="container px-4 py-6 sm:py-8 space-y-4">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="Brito Solutions TV" className="h-10 w-auto opacity-60" />
          <div className="text-center">
            <p className="font-display text-sm font-bold text-foreground/70 flex items-center gap-1.5 justify-center">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Brito Solutions TV
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Sua agenda esportiva completa
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-auto h-px w-16 bg-border/50" />

        {/* Info */}
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Atualizado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>

          {isAdmin ? (
            <a
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-[10px] sm:text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Settings className="h-3 w-3" />
              Painel Admin
            </a>
          ) : (
            <a
              href="/login"
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/30 transition-colors hover:text-muted-foreground/60"
            >
              <Lock className="h-2.5 w-2.5" />
              Admin
            </a>
          )}
        </div>

        <p className="text-center text-[9px] text-muted-foreground/40">
          © {new Date().getFullYear()} Brito Solutions. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};
