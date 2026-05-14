import type { DailyGame } from "@/hooks/useDailyGames";
import { SPORT_EMOJI, SPORT_LABEL, type SportType } from "@/lib/gameUtils";
import { GamePremiumCard } from "./GamePremiumCard";
import { themeFor } from "./gamePremiumTheme";

interface Props {
  sport: SportType | string;
  games: DailyGame[];
}

export const SportSection = ({ sport, games }: Props) => {
  if (games.length === 0) return null;
  const theme = themeFor(sport as SportType);

  return (
    <section
      className="mb-5 rounded-2xl border overflow-hidden relative"
      style={{
        background: `linear-gradient(160deg, rgba(${theme.glow},0.10) 0%, rgba(${theme.glow},0.04) 35%, rgba(13,13,13,0.55) 100%)`,
        borderColor: `rgba(${theme.glow},0.22)`,
        boxShadow: `0 6px 22px -14px rgba(${theme.glow},0.55), inset 0 1px 0 rgba(255,255,255,0.03)`,
      }}
    >
      {/* Header com chip do esporte */}
      <header
        className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-2.5 border-b"
        style={{ borderColor: `rgba(${theme.glow},0.18)` }}
      >
        <h2
          className="flex items-center gap-2 text-[19px] uppercase tracking-wide"
          style={{ fontFamily: "Bebas Neue, sans-serif" }}
        >
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[16px]"
            style={{
              background: `rgba(${theme.glow},0.16)`,
              border: `1px solid rgba(${theme.glow},0.32)`,
              boxShadow: `0 0 10px rgba(${theme.glow},0.25)`,
            }}
            aria-hidden
          >
            {SPORT_EMOJI[sport as SportType] ?? "🏆"}
          </span>
          <span style={{ color: theme.accent, textShadow: `0 0 12px rgba(${theme.glow},0.45)` }}>
            {SPORT_LABEL[sport as SportType] ?? sport}
          </span>
        </h2>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full tabular-nums"
          style={{
            background: `rgba(${theme.glow},0.14)`,
            color: theme.accent,
            border: `1px solid rgba(${theme.glow},0.28)`,
          }}
        >
          {games.length} {games.length === 1 ? "jogo" : "jogos"}
        </span>
      </header>

      {/* Lista de jogos */}
      <div className="space-y-2 p-2.5 relative">
        {games.map((g, i) => (
          <GamePremiumCard key={g.id} game={g} index={i} />
        ))}
      </div>
    </section>
  );
};
