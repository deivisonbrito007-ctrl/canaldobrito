import { Search } from "lucide-react";

interface CinemaSearchButtonProps {
  onClick: () => void;
}

export const CinemaSearchButton = ({ onClick }: CinemaSearchButtonProps) => (
  <>
    {/* Mobile: ícone redondo */}
    <button
      type="button"
      onClick={onClick}
      aria-label="Buscar filmes, séries ou canais"
      className="sm:hidden inline-flex items-center justify-center w-11 h-11 rounded-full bg-surface-2/70 backdrop-blur-md border border-border/50 text-foreground hover:border-primary/40 transition-colors min-h-[44px] min-w-[44px]"
    >
      <Search className="w-4 h-4" />
    </button>
    {/* Desktop/tablet: chip glass com placeholder */}
    <button
      type="button"
      onClick={onClick}
      aria-label="Buscar filmes, séries ou canais"
      className="hidden sm:inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-surface-2/70 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors text-sm font-body"
    >
      <Search className="w-4 h-4" />
      <span>Buscar filmes, séries ou canais</span>
      <kbd className="hidden md:inline ml-2 text-[10px] tabular-nums px-1.5 py-0.5 rounded bg-background/60 border border-border/40">/</kbd>
    </button>
  </>
);
