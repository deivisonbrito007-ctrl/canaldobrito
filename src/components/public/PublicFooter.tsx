import logo from "@/assets/logo_brito_solutions_sem_fundo.png";
import { Link } from "react-router-dom";

export const PublicFooter = () => {
  return (
    <footer className="border-t border-border/10 bg-card/30">
      <div className="px-4 py-6 space-y-4">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 opacity-40">
          <img src={logo} alt="Brito Solutions" className="h-6 w-auto" />
          <span className="text-[10px] font-semibold text-foreground/50">Brito Solutions</span>
        </div>

        <Link
          to="/login"
          className="block text-center text-[9px] text-muted-foreground/15 hover:text-muted-foreground/40 transition-colors"
        >
          © {new Date().getFullYear()} Brito Solutions
        </Link>
      </div>
    </footer>
  );
};
