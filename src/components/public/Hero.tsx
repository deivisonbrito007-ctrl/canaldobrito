import { useDailyGames } from "@/hooks/useDailyGames";
import { getLocalDateString, isGameCurrentlyLive, type SportType } from "@/lib/gameUtils";
import { useMemo } from "react";

export const Hero = () => {
  const dateStr = getLocalDateString();
  const { data: games } = useDailyGames(dateStr);

  const stats = useMemo(() => {
    const allGames = games || [];
    const liveCount = allGames.filter((g) => {
      const st = (g.sport_type || "football") as SportType;
      return isGameCurrentlyLive(g.game_time, g.date, st);
    }).length;

    const channels = new Set<string>();
    allGames.forEach((g) => g.channels?.forEach((c) => channels.add(c)));

    return {
      live: liveCount,
      tonight: allGames.length,
      channels: channels.size,
    };
  }, [games]);

  return (
    <section className="px-4 py-6 animate-fade-up stagger-1">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Welcome */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-green-dim border border-green-border px-3 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary animate-pulse-live" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary font-body">
              Bem-vindo de volta
            </span>
          </div>

          <h2 className="text-[28px] sm:text-[34px] font-bold leading-[1.1] tracking-tight font-body" style={{ letterSpacing: "-0.8px" }}>
            O que vai{" "}
            <span className="text-primary">assistir</span>{" "}
            <span className="text-foreground/30">hoje?</span>
          </h2>

          <p className="text-xs text-muted-foreground font-body max-w-xs">
            Esportes ao vivo, filmes e séries — tudo num só lugar.
          </p>
        </div>

        {/* Right: Stats card */}
        <div className="shrink-0 rounded-xl bg-surface border border-border overflow-hidden">
          <div className="flex divide-x divide-border">
            <div className="px-3.5 py-3 text-center min-w-[56px]">
              <p className="text-lg font-bold text-primary font-body tabular-nums">{stats.live}</p>
              <p className="text-[8px] uppercase font-bold tracking-wider text-muted-foreground font-body">Ao vivo</p>
            </div>
            <div className="px-3.5 py-3 text-center min-w-[56px]">
              <p className="text-lg font-bold text-foreground font-body tabular-nums">{stats.tonight}</p>
              <p className="text-[8px] uppercase font-bold tracking-wider text-muted-foreground font-body">Esta noite</p>
            </div>
            <div className="px-3.5 py-3 text-center min-w-[56px]">
              <p className="text-lg font-bold text-foreground font-body tabular-nums">{stats.channels}</p>
              <p className="text-[8px] uppercase font-bold tracking-wider text-muted-foreground font-body">Canais</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
