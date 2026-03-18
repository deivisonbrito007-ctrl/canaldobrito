import { useTodayGames } from "@/hooks/useGames";
import { GameCard } from "./GameCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, CalendarOff } from "lucide-react";
import { motion } from "framer-motion";

export const GamesSection = () => {
  const { data: games, isLoading } = useTodayGames();

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Jogos de Hoje
        </h2>
        {games && games.length > 0 && (
          <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {games.length} {games.length === 1 ? "jogo" : "jogos"}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : !games || games.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-border/50 bg-card p-8 text-center"
        >
          <CalendarOff className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum jogo programado para hoje</p>
        </motion.div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {games.map((game, idx) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <GameCard game={game} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};
