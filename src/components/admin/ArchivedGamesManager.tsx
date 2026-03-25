import { useState, useMemo } from "react";
import { useArchivedDailyGames, useUpdateDailyGame, useDeleteDailyGame } from "@/hooks/useDailyGames";
import { SPORT_EMOJI, type SportType } from "@/lib/gameUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ArchiveRestore, Loader2, Archive, Filter } from "lucide-react";
import { toast } from "sonner";

export const ArchivedGamesManager = () => {
  const { data: games, isLoading } = useArchivedDailyGames();
  const updateGame = useUpdateDailyGame();
  const deleteGame = useDeleteDailyGame();
  const [dateFilter, setDateFilter] = useState<string | null>(null);

  const dates = useMemo(() => {
    if (!games) return [];
    return [...new Set(games.map((g) => g.date))];
  }, [games]);

  const filtered = useMemo(() => {
    if (!games) return [];
    if (!dateFilter) return games;
    return games.filter((g) => g.date === dateFilter);
  }, [games, dateFilter]);

  const handleUnarchive = (id: string) => {
    updateGame.mutate(
      { id, archived: false, active: true },
      { onSuccess: () => toast.success("Jogo desarquivado!") }
    );
  };

  const handleDelete = (id: string) => {
    if (!confirm("Excluir permanentemente este jogo?")) return;
    deleteGame.mutate(id, { onSuccess: () => toast.success("Jogo excluído!") });
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 sm:p-6 border-b border-white/[0.06]">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Archive className="h-4 w-4 text-muted-foreground" />
            Jogos Arquivados
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {games?.length || 0} jogos arquivados • {dates.length} datas
          </p>
        </div>
      </div>

      {/* Date filter pills */}
      {dates.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none px-5 pt-4 pb-1">
          <button
            onClick={() => setDateFilter(null)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              !dateFilter
                ? "bg-primary/15 text-primary border border-primary/30"
                : "glass-panel text-muted-foreground/70 hover:text-foreground"
            }`}
          >
            <Filter className="h-3 w-3 inline mr-1" />
            Todas ({games?.length})
          </button>
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setDateFilter(dateFilter === d ? null : d)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                dateFilter === d
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "glass-panel text-muted-foreground/70 hover:text-foreground"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      <div className="p-5 sm:p-6 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center">
            <Archive className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum jogo arquivado</p>
          </div>
        ) : (
          filtered.map((game) => (
            <div
              key={game.id}
              className="rounded-xl glass-panel p-3 flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs">{SPORT_EMOJI[game.sport_type as SportType] || "⚽"}</span>
                  <p className="text-sm font-bold text-foreground truncate">
                    {game.home_team} x {game.away_team}
                  </p>
                  <Badge className="bg-muted/50 text-muted-foreground border-muted text-[9px] px-1.5 py-0 shrink-0">
                    {game.date}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  ⏰ {game.game_time?.slice(0, 5)} • {game.competition}
                  {game.competition_detail ? ` · ${game.competition_detail}` : ""}
                </p>
                <p className="text-[10px] text-muted-foreground/60">
                  📺 {game.channels?.join(", ") || "—"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleUnarchive(game.id)}
                  className="h-7 text-xs text-primary gap-1"
                >
                  <ArchiveRestore className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Desarquivar</span>
                </Button>
                <button
                  onClick={() => handleDelete(game.id)}
                  className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
