import { Zap, Flag } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
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
import { Separator } from "@/components/ui/separator";

type CardSport = "football" | "basketball" | "volleyball" | "tennis" | "other";

const SPORT_ACCENT: Record<CardSport, string> = {
  football: "#e74c3c",
  basketball: "#3498db",
  volleyball: "#9b59b6",
  tennis: "#27ae60",
  other: "#e67e22",
};

const mapSportType = (st: string): CardSport => {
  if (st === "football") return "football";
  if (st === "basketball") return "basketball";
  if (st === "volleyball") return "volleyball";
  if (st === "tennis") return "tennis";
  return "other";
};

const LiveCard = ({
  game,
  isEvent,
}: {
  game: DailyGame;
  isEvent: boolean;
}) => {
  const sportType = (game.sport_type || "football") as SportType;
  const cardSport = mapSportType(game.sport_type);
  const accent = isEvent ? "#e67e22" : SPORT_ACCENT[cardSport];
  const emoji = SPORT_EMOJI[sportType] || "🏁";
  const elapsed = getElapsedMinutes(game.game_time, game.date, sportType);

  const league = [
    game.competition,
    game.competition_detail,
  ]
    .filter(Boolean)
    .join(" · ");

  const channel = game.channels?.[0];

  return (
    <div className="min-w-[240px] w-[240px] shrink-0 snap-start">
      <div
        className="rounded-[14px] overflow-hidden transition-colors duration-200"
        style={{ background: "#1a1d2e", border: "1px solid #2a2d3e" }}
      >
        <div className="h-[3px]" style={{ background: accent }} />

        <div className="p-3 space-y-2.5">
          {/* Top row */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider truncate text-[#8b8fa3] font-body">
              {emoji} {league || cardSport}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#e74c3c] animate-[livePulse_1.5s_ease-in-out_infinite]" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e74c3c]" />
              </span>
              <span className="text-[10px] font-bold text-[#e74c3c] tabular-nums font-body">
                {elapsed !== null ? `${elapsed}'` : "Ao vivo"}
              </span>
            </div>
          </div>

          {/* Content */}
          {isEvent ? (
            <div className="text-center space-y-0.5">
              <p className="text-[13px] font-bold text-white leading-tight font-body line-clamp-2">
                {game.home_team}
                {game.away_team && game.away_team !== game.home_team && ` — ${game.away_team}`}
              </p>
              {game.competition_detail && (
                <p className="text-[11px] text-[#6b6f82] font-body">{game.competition_detail}</p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-white leading-tight font-body line-clamp-2">
                    {game.home_team}
                  </p>
                  {game.is_womens && (
                    <p className="text-[10px] text-[#6b6f82] font-body mt-0.5">Feminino</p>
                  )}
                </div>
                <span className="text-[10px] text-[#6b6f82] font-body shrink-0 pt-0.5">vs</span>
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-[13px] font-bold text-white leading-tight font-body line-clamp-2">
                    {game.away_team}
                  </p>
                  {game.is_womens && (
                    <p className="text-[10px] text-[#6b6f82] font-body mt-0.5">Feminino</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 flex items-center justify-between gap-2" style={{ borderTop: "1px solid #2a2d3e" }}>
          <span className="text-[10px] text-[#6b6f82] font-body">
            Começou {game.game_time?.slice(0, 5)}
          </span>
          {channel && <ChannelBadge name={channel} />}
        </div>
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

  const { matches, events } = useMemo(() => {
    const live = (games || []).filter((g) => {
      const st = (g.sport_type || "football") as SportType;
      return isGameCurrentlyLive(g.game_time, g.date, st);
    });

    const m: DailyGame[] = [];
    const e: DailyGame[] = [];
    live.forEach((g) => {
      const st = (g.sport_type || "football") as SportType;
      if (isNonAdversarial(st)) {
        e.push(g);
      } else {
        m.push(g);
      }
    });
    return { matches: m, events: e };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games, Math.floor(Date.now() / 60000)]);

  const totalLive = matches.length + events.length;
  if (totalLive === 0) return null;

  return (
    <section className="space-y-3">
      <div className="px-4">
        <SectionHeader
          icon={Zap}
          title="Ao Vivo"
          subtitle="Acompanhe os jogos em tempo real"
          badge={
            <span className="text-[10px] bg-destructive/15 text-destructive rounded-full px-2 py-0.5 font-bold font-body tabular-nums animate-pulse">
              {totalLive} ao vivo
            </span>
          }
        />
      </div>

      {/* Adversarial matches */}
      {matches.length > 0 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2 snap-x snap-mandatory">
          {matches.map((g) => (
            <LiveCard key={g.id} game={g} isEvent={false} />
          ))}
        </div>
      )}

      {/* Divider when both types exist */}
      {matches.length > 0 && events.length > 0 && (
        <div className="px-4 flex items-center gap-2">
          <Flag className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 font-body">Eventos</span>
          <Separator className="flex-1 bg-amber-500/20" />
        </div>
      )}

      {/* Non-adversarial events */}
      {events.length > 0 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2 snap-x snap-mandatory">
          {events.map((g) => (
            <LiveCard key={g.id} game={g} isEvent={true} />
          ))}
        </div>
      )}
    </section>
  );
};
