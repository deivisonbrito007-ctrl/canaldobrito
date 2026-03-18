import { Game } from "@/types/sports";
import { GameCard } from "./GameCard";
import { Star } from "lucide-react";

interface FeaturedGamesProps {
  games: Game[];
  onSelect: (game: Game) => void;
}

export const FeaturedGames = ({ games, onSelect }: FeaturedGamesProps) => {
  if (games.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-bold text-foreground">Destaques do Dia</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} onClick={onSelect} featured />
        ))}
      </div>
    </section>
  );
};
