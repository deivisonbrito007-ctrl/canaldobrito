import { ChannelBadge } from "./ChannelBadge";
import { useDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import { useState, useEffect, useMemo } from "react";
import {
  isGameCurrentlyLive,
  getLocalDateString,
  getElapsedMinutes,
  SPORT_EMOJI,
  isNonAdversarial,
  type SportType,
} from "@/lib/gameUtils";

type CardSport = "football" | "basketball" | "volleyball" | "tennis" | "other";

const SPORT_ACCENT: Record<CardSport, string> = {
  football: "hsl(0 72% 56%)",
  basketball: "hsl(207 72% 52%)",
  volleyball: "hsl(272 50% 55%)",
  tennis: "hsl(145 55% 42%)",
  other: "hsl(207 60% 48%)",
};

const mapSportType = (st: string): CardSport => {
  if (st === "football") return "football";
  if (st === "basketball") return "basketball";
  if (st === "volleyball") return "volleyball";
  if (st === "tennis") return "tennis";
  return "other";
};

const LiveGameCard = ({ game }: { game: DailyGame }) => {
  const sportType = (game.sport_type || "football") as SportType;
  const cardSport = mapSportType(game.sport_type);
  const accent = SPORT_ACCENT[cardSport];
  const emoji = SPORT_EMOJI[sportType] || "🏁";
  const elapsed = getElapsedMinutes(game.game_time, game.date, sportType);
  const league = [game.competition, game.competition_detail].filter(Boolean).join(" · ");
  const channel = game.channels?.[0];

  return (
    <div
      className="rounded-[14px] overflow-hidden transition-all duration-200 hover:border-primary/30 hover:-translate-y-0.5 bg-surface-2 border border-border"
    >
      <div className="h-[2.5px]" style={{ background: accent }} />
      <div className="p-3 space-y-2">
        {/* Top row */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[9px] font-bold uppercase tracking-wider truncate text-muted-foreground font-body">
            {emoji} {league || cardSport}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-destructive animate-pulse-live" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
            </span>
            <span className="text-[9px] font-bold text-destructive tabular-nums font-body">
              {elapsed !== null ? `${elapsed}'` : "AO VIVO"}
            </span>
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-start gap-1.5">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-foreground leading-tight font-body line-clamp-2">
              {game.home_team}
            </p>
            {game.is_womens && (
              <p className="text-[9px] text-muted-foreground font-body mt-0.5">Feminino</p>
            )}
          </div>
          <span className="text-[9px] text-muted-foreground font-body shrink-0 pt-1 px-1 rounded bg-surface border border-border">
            VS
          </span>
          <div className="flex-1 min-w-0 text-right">
            <p className="text-[13px] font-bold text-foreground leading-tight font-body line-clamp-2">
              {game.away_team}
            </p>
            {game.is_womens && (
              <p className="text-[9px] text-muted-foreground font-body mt-0.5">Feminino</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 flex items-center justify-between gap-2 border-t border-border">
        <span className="text-[9px] text-muted-foreground font-body">
          Começou {game.game_time?.slice(0, 5)}
        </span>
        {channel && <ChannelBadge name={channel} />}
      </div>
    </div>
  );
};

export const LiveFeedSection = () => {
  const [today, setToday] = useState(() => getLocalDateString());
  const { data: games } = useDailyGames(today);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setToday(getLocalDateString());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const matches = useMemo(() => {
    return (games || []).filter((g) => {
      const st = (g.sport_type || "football") as SportType;
      return !isNonAdversarial(st) && isGameCurrentlyLive(g.game_time, g.date, st);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games, Math.floor(Date.now() / 60000)]);

  if (matches.length === 0) return null;

  return (
    <section className="space-y-3 animate-fade-up stagger-4">
      <div className="px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary animate-pulse-live" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          <h3 className="text-sm font-bold text-foreground font-body">
            Ao Vivo <span className="text-primary">Canal do Brito</span>
          </h3>
          <span className="text-[10px] bg-destructive/15 text-destructive rounded-full px-2 py-0.5 font-bold font-body tabular-nums">
            {matches.length} jogos
          </span>
        </div>
        <span className="text-[10px] text-primary font-semibold font-body cursor-pointer hover:underline">
          Ver todos →
        </span>
      </div>

      <div className="px-4 grid grid-cols-2 lg:grid-cols-4 gap-[9px]">
        {matches.map((g) => (
          <LiveGameCard key={g.id} game={g} />
        ))}
      </div>
    </section>
  );
};
