import { Zap, Phone } from "lucide-react";
import logo from "@/assets/logo_brito_solutions_sem_fundo.png";
import { Link } from "react-router-dom";

export const PublicFooter = () => {
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

        <Link
          to="/login"
          className="block text-center text-[10px] text-muted-foreground/15 hover:text-muted-foreground/40 transition-colors"
        >
          © {new Date().getFullYear()} Brito Solutions • Todos os direitos reservados
        </Link>
      </div>
    </footer>
  );
};
