import { useAuth } from "@/contexts/AuthContext";
import { Settings, Lock, Zap, Phone } from "lucide-react";
import logo from "@/assets/logo_brito_solutions_sem_fundo.png";

export const PublicFooter = () => {
  const { isAdmin } = useAuth();

  return (
    <footer className="relative border-t border-border/10 bg-card/20">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="px-4 py-10 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-primary/5 blur-xl" />
            <img src={logo} alt="Brito Solutions" className="relative h-12 w-auto opacity-60" />
          </div>
          <div className="text-center space-y-2">
            <p className="font-display text-sm font-bold text-foreground/50 flex items-center gap-1.5 justify-center">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Brito Solutions
            </p>
            <a
              href="tel:+5511940759046"
              className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-primary transition-colors justify-center"
            >
              <Phone className="h-3.5 w-3.5" />
              (11) 94075-9046
            </a>
          </div>
        </div>

        <div className="section-divider mx-auto max-w-[200px]" />

        <div className="flex flex-col items-center gap-3">
          {isAdmin ? (
            <a
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-5 py-2.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20 hover:border-primary/30 min-h-[44px]"
            >
              <Settings className="h-4 w-4" />
              Painel Admin
            </a>
          ) : (
            <a
              href="/login"
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/15 hover:text-muted-foreground/40 transition-colors"
            >
              <Lock className="h-2.5 w-2.5" />
              Admin
            </a>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground/25 font-medium">
          © {new Date().getFullYear()} Brito Solutions • Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
};
