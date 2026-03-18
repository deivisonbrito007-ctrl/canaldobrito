import { Zap } from "lucide-react";
import logo from "@/assets/logo_brito_solutions_sem_fundo.png";
import { Link } from "react-router-dom";

export const PublicFooter = () => {
  const handleShare = () => {
    const url = window.location.href;
    const msg = encodeURIComponent(
      `📺 Confira a programação de hoje! Filmes, séries e esportes ao vivo: ${url} - Brito Solutions`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <footer className="relative border-t border-border/10 bg-card/20">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="px-4 py-6 space-y-4">
        <div className="flex items-center justify-center gap-3">
          <img src={logo} alt="Brito Solutions" className="h-8 w-auto opacity-50" />
          <p className="font-display text-xs font-bold text-foreground/40 flex items-center gap-1">
            <Zap className="h-3 w-3 text-primary" />
            Brito Solutions
          </p>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-xs text-muted-foreground/50 hover:text-primary transition-colors px-4 py-2 rounded-full border border-border/20 min-h-[44px]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Compartilhar
          </button>
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
