import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDailyGames } from "@/hooks/useDailyGames";
import { getLocalDateString, isGameCurrentlyLive, type SportType } from "@/lib/gameUtils";
import { useMemo } from "react";

export const AppNavbar = () => {
  const today = new Date();
  const dateStr = getLocalDateString();
  const { data: games } = useDailyGames(dateStr);

  const liveCount = useMemo(() => {
    return (games || []).filter((g) => {
      const st = (g.sport_type || "football") as SportType;
      return isGameCurrentlyLive(g.game_time, g.date, st);
    }).length;
  }, [games]);

  return (
    <header className="sticky top-0 z-50 glass-nav" style={{ height: 54 }}>
      <div className="flex items-center justify-between px-4 h-full">
        {/* Left: Logo + Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-[30px] h-[30px] rounded-lg bg-green-dim">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-primary">
              <rect x="2" y="4" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
              <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="18" x2="12" y2="21" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight font-body">
            <span className="text-foreground">Canal do</span>{" "}
            <span className="text-primary">Brito</span>
          </span>
        </div>

        {/* Center: Date */}
        <p className="hidden sm:block text-xs text-muted-foreground capitalize font-body">
          {format(today, "EEE · d MMM", { locale: ptBR })}
        </p>

        {/* Right: Live badge + CTA */}
        <div className="flex items-center gap-3">
          {liveCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary font-body">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary animate-pulse-live" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              {liveCount} ao vivo
            </div>
          )}
          <a
            href={`https://wa.me/5511940759046?text=${encodeURIComponent("Olá! Tenho interesse em assinar o plano Brito Solutions 📺")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground text-[11px] font-bold px-3.5 py-1.5 rounded-full hover:opacity-90 transition-opacity"
          >
            Assine já
          </a>
        </div>
      </div>
      <div className="section-divider" />
    </header>
  );
};
