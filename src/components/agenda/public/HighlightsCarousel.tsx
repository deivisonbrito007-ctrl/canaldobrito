import type { Highlight } from "./highlightsCuration";
import { detectedSport } from "./highlightsCuration";
import { themeFor } from "./gamePremiumTheme";
import { SPORT_EMOJI, SPORT_LABEL, type SportType } from "@/lib/gameUtils";
import { ChannelBadge } from "@/components/public/ChannelBadge";

interface Props {
  highlights: Highlight[];
}

export const HighlightsCarousel = ({ highlights }: Props) => {
  if (highlights.length === 0) return null;

  return (
    <section className="mb-6" aria-label="Imperdíveis de hoje">
      <h2
        className="flex items-center gap-2 text-[20px] uppercase tracking-wide mb-2.5 px-0"
        style={{ fontFamily: "Bebas Neue, sans-serif" }}
      >
        <span className="text-[22px]">🔥</span>
        <span className="text-white">Imperdíveis de Hoje</span>
        <span className="text-white/35 text-xs normal-case tracking-normal font-normal">
          · {highlights.length}
        </span>
      </h2>

      <div
        className="-mx-4 px-4 overflow-x-auto scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex gap-3 pb-1">
          {highlights.map(({ game, reason }) => {
            const sport = detectedSport(game);
            const theme = themeFor(sport);
            const time = game.game_time.slice(0, 5);
            const isVs = !!game.away_team;
            return (
              <article
                key={game.id}
                className="snap-start shrink-0 w-[260px] rounded-2xl p-3.5 border relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, rgba(${theme.glow},0.10) 0%, rgba(13,13,13,0.92) 70%)`,
                  borderColor: `rgba(${theme.glow},0.28)`,
                  boxShadow: `0 6px 24px -10px rgba(${theme.glow},0.5)`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: theme.accent }}
                  >
                    {SPORT_EMOJI[sport]} {SPORT_LABEL[sport] ?? sport}
                  </span>
                  {reason === "live" && (
                    <span className="text-[9.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#ff3b3b] text-[#0a0000]">
                      AO VIVO
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-1.5">
                  <span
                    className="text-[26px] tabular-nums leading-none"
                    style={{ fontFamily: "Bebas Neue, sans-serif", color: theme.accent }}
                  >
                    {time}
                  </span>
                </div>

                <p
                  className="text-white text-[15px] leading-tight font-semibold line-clamp-2 min-h-[2.4em]"
                >
                  {isVs ? `${game.home_team} × ${game.away_team}` : game.home_team}
                </p>

                {game.competition && (
                  <p className="text-[11px] text-white/55 mt-1.5 truncate">
                    🏆 {game.competition}
                  </p>
                )}

                {game.channels && game.channels.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <ChannelBadge name={game.channels[0]} size="sm" />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
