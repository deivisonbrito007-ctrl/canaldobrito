import { Game, SPORTS } from "@/types/sports";
import { GameCard } from "./GameCard";

interface GameSectionProps {
  games: Game[];
  onSelect: (game: Game) => void;
}

export const GameSection = ({ games, onSelect }: GameSectionProps) => {
  const grouped = games.reduce<Record<string, Record<string, Game[]>>>((acc, game) => {
    if (!acc[game.sport]) acc[game.sport] = {};
    if (!acc[game.sport][game.league]) acc[game.sport][game.league] = [];
    acc[game.sport][game.league].push(game);
    return acc;
  }, {});

  const sportOrder = SPORTS.map((s) => s.type);

  return (
    <div className="space-y-6 sm:space-y-8">
      {sportOrder.map((sportType) => {
        const leagues = grouped[sportType];
        if (!leagues) return null;

        const sport = SPORTS.find((s) => s.type === sportType)!;

        return (
          <section key={sportType} className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 border-b border-border/30 pb-2">
              <span className="text-lg sm:text-xl">{sport.icon}</span>
              <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wide text-foreground">
                {sport.label}
              </h2>
            </div>

            {Object.entries(leagues).map(([league, leagueGames]) => (
              <div key={league} className="space-y-2">
                <h3 className="pl-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {league}
                </h3>
                <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {leagueGames.map((game) => (
                    <GameCard key={game.id} game={game} onClick={onSelect} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
};
