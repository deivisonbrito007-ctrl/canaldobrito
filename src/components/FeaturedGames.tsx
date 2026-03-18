import { Game } from "@/types/sports";
import { GameCard } from "./GameCard";
import { Flame } from "lucide-react";

interface FeaturedGamesProps {
  games: Game[];
  onSelect: (game: Game) => void;
}

export const FeaturedGames = ({ games, onSelect }: FeaturedGamesProps) => {
  if (games.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-[hsl(var(--live))]" />
        <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
          {games.some((g) => g.status === "live") ? "Ao Vivo & Destaques" : "Destaques do Dia"}
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} onClick={onSelect} featured />
        ))}
      </div>
    </section>
  );
};
