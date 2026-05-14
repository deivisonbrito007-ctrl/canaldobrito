import { motion } from "framer-motion";
import type { DailyGame } from "@/hooks/useDailyGames";
import { ChannelBadge } from "@/components/public/ChannelBadge";
import { isGameCurrentlyLive, type SportType, getMinutesUntilStart, formatCountdown, getElapsedMinutes, SPORT_EMOJI } from "@/lib/gameUtils";
import { detectedSport } from "./highlightsCuration";
import { themeFor } from "./gamePremiumTheme";

interface Props {
  game: DailyGame;
  index: number;
}

export const GamePremiumCard = ({ game, index }: Props) => {
  const sport = detectedSport(game);
  const theme = themeFor(sport);
  const time = game.game_time.slice(0, 5);
  const live = isGameCurrentlyLive(game.game_time, game.date, sport as SportType);
  const elapsed = live ? getElapsedMinutes(game.game_time, game.date, sport as SportType) : null;
  const minutesUntil = !live ? getMinutesUntilStart(game.game_time, game.date) : null;
  const soon = minutesUntil !== null && minutesUntil <= 60;
  const ended = !live && minutesUntil === null;
  const isVs = !!game.away_team;

  return (
    <motion.div
      id={`game-${game.id}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03 }}
      className="relative rounded-xl overflow-hidden border bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
      style={{
        borderColor: live ? "rgba(255,59,59,0.32)" : "rgba(255,255,255,0.08)",
        boxShadow: live ? "0 0 20px rgba(255,59,59,0.12)" : undefined,
      }}
    >
      {/* Accent bar lateral */}
      <div
        aria-hidden
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r"
        style={{
          background: live ? "#ff3b3b" : theme.accent,
          boxShadow: `0 0 10px rgba(${live ? "255,59,59" : theme.glow},0.55)`,
        }}
      />

      {/* Watermark do esporte */}
      <span
        aria-hidden
        className="absolute -right-3 -bottom-4 text-[88px] leading-none select-none pointer-events-none motion-reduce:opacity-[0.04]"
        style={{
          opacity: 0.07,
          filter: `drop-shadow(0 0 12px rgba(${theme.glow},0.35))`,
          transform: "rotate(-12deg)",
        }}
      >
        {SPORT_EMOJI[sport] ?? "🏆"}
      </span>


      <div className="pl-3.5 pr-3 py-3 flex items-start gap-3.5">
        {/* Horário */}
        <div className="shrink-0 w-[64px] text-center pr-1 border-r border-white/5">
          <p
            className="text-[24px] leading-none tabular-nums"
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              color: live ? "#ff3b3b" : theme.accent,
            }}
          >
            {time}
          </p>
          <p className="text-[9px] uppercase tracking-wider mt-1 font-bold tabular-nums whitespace-nowrap"
             style={{ color: live ? "#ff3b3b" : soon ? "#fbbf24" : ended ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.45)" }}>
            {live
              ? elapsed !== null ? `AO VIVO · ${elapsed}'` : "AO VIVO"
              : soon ? formatCountdown(minutesUntil!) : ended ? "Encerrado" : "Em breve"}
          </p>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[14.5px] leading-snug text-white truncate">
            {isVs ? (
              <>
                {game.home_team} <span className="text-white/40 mx-1">×</span> {game.away_team}
              </>
            ) : (
              game.home_team
            )}
          </p>
          {game.competition && (
            <p className="text-[11px] text-white/55 mt-0.5 truncate">
              🏆 {game.competition}
              {game.competition_detail ? ` · ${game.competition_detail}` : ""}
            </p>
          )}
          {game.channels && game.channels.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {game.channels.slice(0, 3).map((ch, i) => (
                <ChannelBadge key={`${game.id}-ch-${i}`} name={ch} size="sm" />
              ))}
            </div>
          )}
        </div>

        {live && (
          <span
            aria-label="ao vivo"
            className="shrink-0 w-2 h-2 rounded-full bg-[#ff3b3b] motion-safe:animate-pulse"
          />
        )}
      </div>
    </motion.div>
  );
};
