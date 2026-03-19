import logo from "@/assets/logo_brito_solutions_sem_fundo.png";
import { Link } from "react-router-dom";

export const PublicFooter = () => {
  return (
    <footer className="pb-20">
      <div className="section-divider" />
      <div className="px-4 py-10 space-y-5">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="Brito Solutions" className="h-12 w-auto glow-primary-subtle" />
          <span className="text-base font-bold text-gradient-primary">Brito Solutions</span>
          <p className="text-xs text-muted-foreground/60 font-body">
            Sua experiência premium de streaming
          </p>
        </div>

        <Link
          to="/login"
          className="block text-center text-[10px] text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors"
        >
          © {new Date().getFullYear()} Brito Solutions
        </Link>
      </div>
    </footer>
  );
};
