import { Game } from "@/types/sports";
import { GameCard } from "./GameCard";
import { format } from "date-fns";
import { Sun, Sunrise, Sunset, Moon } from "lucide-react";

interface GameSectionProps {
  games: Game[];
  onSelect: (game: Game) => void;
}

type TimePeriod = "madrugada" | "manha" | "tarde" | "noite";

const getTimePeriod = (dateStr: string): TimePeriod => {
  const hour = new Date(dateStr).getHours();
  if (hour >= 0 && hour < 6) return "madrugada";
  if (hour >= 6 && hour < 12) return "manha";
  if (hour >= 12 && hour < 18) return "tarde";
  return "noite";
};

const periodConfig: Record<TimePeriod, { label: string; icon: React.ReactNode }> = {
  madrugada: { label: "Madrugada", icon: <Moon className="h-4 w-4" /> },
  manha: { label: "Manhã", icon: <Sunrise className="h-4 w-4" /> },
  tarde: { label: "Tarde", icon: <Sun className="h-4 w-4" /> },
  noite: { label: "Noite", icon: <Sunset className="h-4 w-4" /> },
};

const periodOrder: TimePeriod[] = ["manha", "tarde", "noite", "madrugada"];

export const GameSection = ({ games, onSelect }: GameSectionProps) => {
  const grouped = games.reduce<Record<TimePeriod, Game[]>>((acc, game) => {
    const period = getTimePeriod(game.startTime);
    if (!acc[period]) acc[period] = [];
    acc[period].push(game);
    return acc;
  }, {} as Record<TimePeriod, Game[]>);

  return (
    <div className="space-y-6 sm:space-y-8">
      {periodOrder.map((period) => {
        const periodGames = grouped[period];
        if (!periodGames || periodGames.length === 0) return null;

        const config = periodConfig[period];

        return (
          <section key={period} className="space-y-3">
            <div className="flex items-center gap-2 border-b border-border/30 pb-2">
              <span className="text-muted-foreground">{config.icon}</span>
              <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wide text-foreground">
                {config.label}
              </h2>
              <span className="ml-auto text-[10px] text-muted-foreground">
                {periodGames.length} jogo{periodGames.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {periodGames
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((game) => (
                  <GameCard key={game.id} game={game} onClick={onSelect} />
                ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
