import logo from "@/assets/canal_do_brito_logo.png";
import { Link } from "react-router-dom";

export const PublicFooter = () => {
  return (
    <footer className="pb-20">
      <div className="section-divider" />
      <div className="px-4 py-10 space-y-5">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="Canal do Brito" className="h-14 w-auto object-contain" />
          <span className="font-body text-lg font-bold tracking-tight">
            <span className="text-foreground">Canal do</span>{" "}
            <span className="text-primary">Brito</span>
          </span>
          <p className="text-xs text-muted-foreground/60 font-body">
            Sua experiência premium de streaming
          </p>
        </div>

        <Link
          to="/login"
          className="block text-center text-[10px] text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors"
        >
          © {new Date().getFullYear()} Canal do Brito
        </Link>
      </div>
    </footer>
  );
};
