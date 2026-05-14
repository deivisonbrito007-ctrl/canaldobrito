import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DailyGame } from "@/hooks/useDailyGames";
import { ChannelBadge } from "@/components/public/ChannelBadge";
import { SPORT_EMOJI, SPORT_LABEL, type SportType } from "@/lib/gameUtils";
import { detectedSport } from "./highlightsCuration";
import { themeFor } from "./gamePremiumTheme";

interface Props {
  games: DailyGame[];
}

export const LiveHeroCard = ({ games }: Props) => {
  const [index, setIndex] = useState(0);
  if (games.length === 0) return null;
  const i = Math.min(index, games.length - 1);
  const game = games[i];
  const sport = detectedSport(game);
  const theme = themeFor(sport);
  const isVs = !!game.away_team;

  return (
    <section className="mb-5" aria-label="Jogo ao vivo">
      <div className="relative">
        {/* Glow vermelho ambiente */}
        <motion.div
          aria-hidden
          className="absolute -inset-1 rounded-[22px] opacity-60 blur-2xl pointer-events-none motion-reduce:hidden"
          style={{ background: "radial-gradient(60% 60% at 50% 50%, rgba(255,59,59,0.45), transparent 70%)" }}
          animate={{ opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <AnimatePresence mode="wait">
          <motion.article
            key={game.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="relative overflow-hidden rounded-2xl border p-4 sm:p-5"
            style={{
              background: "linear-gradient(135deg, rgba(255,59,59,0.10) 0%, rgba(13,13,13,0.85) 60%, rgba(13,13,13,0.95) 100%)",
              borderColor: "rgba(255,59,59,0.32)",
              boxShadow: "0 0 30px rgba(255,59,59,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            {/* Top row: badge AO VIVO + sport */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-black uppercase tracking-[0.14em]"
                style={{ background: "#ff3b3b", color: "#0a0000" }}
              >
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-white"
                  animate={{ opacity: [1, 0.25, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                AO VIVO
              </span>
              <span className="text-[11px] text-white/60 font-medium flex items-center gap-1">
                <span>{SPORT_EMOJI[sport] ?? "🏆"}</span>
                <span>{SPORT_LABEL[sport] ?? sport}</span>
              </span>
            </div>

            {/* Times */}
            <div
              className="text-white"
              style={{ fontFamily: "Bebas Neue, sans-serif" }}
            >
              {isVs ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[26px] sm:text-[30px] leading-[0.95] flex-1 truncate">{game.home_team}</p>
                  <span className="text-[20px] text-white/40 px-2">×</span>
                  <p className="text-[26px] sm:text-[30px] leading-[0.95] flex-1 truncate text-right">{game.away_team}</p>
                </div>
              ) : (
                <p className="text-[28px] sm:text-[32px] leading-[0.95] truncate">{game.home_team}</p>
              )}
            </div>

            {/* Meta */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {game.competition && (
                <span className="inline-flex items-center gap-1 text-[11.5px] text-white/75 font-medium">
                  <span aria-hidden>🏆</span>
                  <span className="truncate max-w-[180px]">
                    {game.competition}
                    {game.competition_detail ? ` · ${game.competition_detail}` : ""}
                  </span>
                </span>
              )}
              {(game.channels ?? []).slice(0, 2).map((ch, idx) => (
                <ChannelBadge key={`${game.id}-ch-${idx}`} name={ch} size="sm" />
              ))}
            </div>

            {/* Accent bar */}
            <div
              aria-hidden
              className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r"
              style={{ background: theme.accent, boxShadow: `0 0 12px rgba(${theme.glow},0.6)` }}
            />
          </motion.article>
        </AnimatePresence>

        {/* Paginação se houver múltiplos */}
        {games.length > 1 && (
          <div className="mt-2.5 flex items-center justify-center gap-1.5">
            {games.map((g, idx) => (
              <button
                key={g.id}
                onClick={() => setIndex(idx)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: idx === i ? 22 : 6,
                  background: idx === i ? "#ff3b3b" : "rgba(255,255,255,0.25)",
                }}
                aria-label={`Jogo ao vivo ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
