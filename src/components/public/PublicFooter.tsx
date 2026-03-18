import { useAuth } from "@/contexts/AuthContext";
import { Settings, Lock, Zap, Phone } from "lucide-react";
import { WhatsAppShareButton } from "./WhatsAppShareButton";
import logo from "@/assets/logo_brito_solutions_sem_fundo.png";

export const PublicFooter = () => {
  const { isAdmin } = useAuth();

  return (
    <footer className="relative border-t border-border/20 bg-background/50 backdrop-blur-sm">
      {/* Gradient line on top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      <div className="container px-4 py-8 sm:py-10 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-primary/10 blur-lg" />
            <img src={logo} alt="Brito Solutions" className="relative h-12 w-auto" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="font-display text-sm font-bold text-foreground flex items-center gap-2 justify-center">
              <Zap className="h-4 w-4 text-primary" />
              Brito Solutions
            </p>
            <a 
              href="tel:+5511940759046"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-3 w-3" />
              (11) 94075-9046
            </a>
          </div>
        </div>

        <div className="flex justify-center">
          <WhatsAppShareButton />
        </div>

        <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="flex flex-col items-center gap-3 text-center">
          {isAdmin ? (
            <a
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-medium text-primary transition-all hover:bg-primary/20 hover:scale-105"
            >
              <Settings className="h-3.5 w-3.5" />
              Painel Admin
            </a>
          ) : (
            <a
              href="/login"
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/20 transition-colors hover:text-muted-foreground/50"
            >
              <Lock className="h-2.5 w-2.5" />
              Admin
            </a>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground/30">
          © {new Date().getFullYear()} Brito Solutions. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};