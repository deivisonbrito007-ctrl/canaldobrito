import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const ITEMS = [
  { emoji: "🎬", label: "Filmes" },
  { emoji: "📺", label: "Séries" },
  { emoji: "⚽", label: "Futebol" },
  { emoji: "🏀", label: "NBA" },
];

export const PremiumCTA = () => (
  <div className="px-4">
    <div
      className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-[hsl(var(--surface-2))] via-background to-[hsl(var(--surface-2))] p-6 sm:p-8"
    >
      {/* glow inferior discreto */}
      <div
        className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 h-48 w-[120%] rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />

      <div className="relative space-y-4">
        <h3 className="font-display text-3xl sm:text-4xl tracking-wide text-foreground leading-tight">
          ASSISTA TUDO <span className="text-primary">SEM LIMITES</span>
        </h3>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-foreground/85 font-body">
          {ITEMS.map((i) => (
            <li key={i.label} className="inline-flex items-center gap-1.5">
              <span aria-hidden>{i.emoji}</span>
              <span>{i.label}</span>
            </li>
          ))}
        </ul>
        <Link
          to="/assinar"
          aria-label="Assinar agora"
          className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 min-h-[52px] px-7 rounded-full bg-primary text-primary-foreground font-bold font-body shadow-[0_14px_40px_-14px_hsl(var(--primary)/0.65)] hover:opacity-95 active:scale-[0.99] transition-all"
        >
          Assinar agora
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  </div>
);
