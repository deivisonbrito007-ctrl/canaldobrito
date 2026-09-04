import { useMemo } from "react";
import type { DailyGame } from "@/hooks/useDailyGames";
import { GamePremiumCard } from "./GamePremiumCard";

interface Props {
  games: DailyGame[];
}

function periodOf(time: string): { key: string; label: string; emoji: string } {
  const h = parseInt(time.slice(0, 2), 10);
  if (h < 6) return { key: "madrugada", label: "Madrugada", emoji: "🌙" };
  if (h < 12) return { key: "manha", label: "Manhã", emoji: "🌅" };
  if (h < 18) return { key: "tarde", label: "Tarde", emoji: "☀️" };
  return { key: "noite", label: "Noite", emoji: "🌃" };
}

/** Lista cronológica agrupada por período do dia. */
export const TimeSection = ({ games }: Props) => {
  const groups = useMemo(() => {
    const out: { key: string; label: string; emoji: string; games: DailyGame[] }[] = [];
    for (const g of games) {
      const p = periodOf(g.game_time);
      let grp = out.find((x) => x.key === p.key);
      if (!grp) {
        grp = { ...p, games: [] };
        out.push(grp);
      }
      grp.games.push(g);
    }
    return out;
  }, [games]);

  if (games.length === 0) return null;

  return (
    <>
      {groups.map((grp) => (
        <section key={grp.key} className="mb-6">
          <h2
            className="flex items-baseline gap-2 text-[20px] uppercase tracking-wide mb-2.5"
            style={{ fontFamily: "Bebas Neue, sans-serif" }}
          >
            <span className="text-[22px] leading-none" aria-hidden>{grp.emoji}</span>
            <span className="text-white">{grp.label}</span>
            <span className="text-white/35 text-xs normal-case tracking-normal font-normal">
              · {grp.games.length} {grp.games.length === 1 ? "jogo" : "jogos"}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {grp.games.map((g, i) => (
              <GamePremiumCard key={g.id} game={g} index={i} showSport />
            ))}
          </div>
        </section>
      ))}
    </>
  );
};
