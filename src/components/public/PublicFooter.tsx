import { useAuth } from "@/contexts/AuthContext";
import { Settings, Lock, Zap, Phone } from "lucide-react";
import logo from "@/assets/logo_brito_solutions_sem_fundo.png";

export const PublicFooter = () => {
  const { isAdmin } = useAuth();

  return (
    <footer className="relative border-t border-border/20 bg-card/30">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="px-4 py-8 space-y-5">
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="Brito Solutions" className="h-10 w-auto opacity-50" />
          <div className="text-center space-y-1">
            <p className="font-display text-sm font-bold text-foreground/60 flex items-center gap-1.5 justify-center">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Brito Solutions
            </p>
            <a
              href="tel:+5511940759046"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors justify-center"
            >
              <Phone className="h-3 w-3" />
              (11) 94075-9046
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          {isAdmin ? (
            <a
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-medium text-primary transition-all hover:bg-primary/20 min-h-[44px]"
            >
              <Settings className="h-3.5 w-3.5" />
              Painel Admin
            </a>
          ) : (
            <a
              href="/login"
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/20 hover:text-muted-foreground/50 transition-colors"
            >
              <Lock className="h-2.5 w-2.5" />
              Admin
            </a>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground/30">
          © {new Date().getFullYear()} Brito Solutions
        </p>
      </div>
    </footer>
  );
};