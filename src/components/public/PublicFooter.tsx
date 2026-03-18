import logo from "@/assets/logo_brito_solutions_sem_fundo.png";
import { Link } from "react-router-dom";

export const PublicFooter = () => {
  return (
    <footer className="pb-20">
      <div className="section-divider" />
      <div className="px-4 py-8 space-y-4">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2">
          <img src={logo} alt="Brito Solutions" className="h-8 w-auto glow-primary-subtle" />
          <span className="text-xs font-semibold text-gradient-primary">Brito Solutions</span>
          <p className="text-[10px] text-muted-foreground/40 font-body">
            Sua experiência premium de streaming
          </p>
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
