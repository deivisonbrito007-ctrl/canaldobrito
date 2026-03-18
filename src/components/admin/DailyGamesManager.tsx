import { useState } from "react";
import { useAllDailyGames, useUpdateDailyGame, useDeleteDailyGame, useInsertDailyGames, useDeleteDailyGamesByDate } from "@/hooks/useDailyGames";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Trash2, Pencil, Check, X, Plus, Loader2, Calendar, Zap, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const DailyGamesManager = () => {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const { data: games, isLoading } = useAllDailyGames(selectedDate);
  const updateGame = useUpdateDailyGame();
  const deleteGame = useDeleteDailyGame();
  const deleteByDate = useDeleteDailyGamesByDate();
  const insertGames = useInsertDailyGames();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSyncFromAPI = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-daily-games", {
        body: { date: selectedDate },
      });
      if (error) throw error;
      toast.success(`${data.inserted} jogos importados da API!`);
    } catch (err: any) {
      toast.error(`Erro ao sincronizar: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleLive = (id: string, current: boolean) => {
    updateGame.mutate({ id, is_live: !current });
  };

  const handleToggleActive = (id: string, current: boolean) => {
    updateGame.mutate({ id, active: !current });
  };

  const handleClearDay = async () => {
    if (!confirm(`Excluir todos os jogos de ${selectedDate}?`)) return;
    try {
      await deleteByDate.mutateAsync(selectedDate);
      toast.success("Jogos do dia removidos!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const activeCount = games?.filter((g) => g.active).length || 0;
  const liveCount = games?.filter((g) => g.is_live).length || 0;

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 sm:p-6 border-b border-white/[0.06]">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Calendar className="h-4 w-4 text-emerald-400" />
            Jogos Publicados
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-emerald-400 font-semibold">{activeCount}</span> ativos
            {liveCount > 0 && (
              <> • <span className="text-red-400 font-semibold">{liveCount}</span> ao vivo</>
            )}
            {" "}/ {games?.length || 0} total
          </p>
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto text-xs h-9 glass-panel border-white/[0.1]"
          />
          <Button size="sm" variant="ghost" onClick={() => setShowAddForm(!showAddForm)} className="text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
          </Button>
          <Button size="sm" variant="ghost" onClick={handleSyncFromAPI} disabled={syncing} className="text-xs text-primary">
            {syncing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1" />}
            Buscar da API
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClearDay} className="text-xs text-destructive">
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Limpar Dia
          </Button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-3">
        {showAddForm && (
          <AddGameForm
            date={selectedDate}
            onClose={() => setShowAddForm(false)}
            insertGames={insertGames}
          />
        )}

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !games || games.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">Nenhum jogo para {selectedDate}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {games.map((game) => (
              <div
                key={game.id}
                className={`rounded-xl glass-panel p-3 flex items-center gap-3 transition-all ${
                  !game.active ? "opacity-40" : ""
                } ${game.is_live ? "border-red-500/30 border" : ""}`}
              >
                {editingId === game.id ? (
                  <InlineEditForm
                    game={game}
                    onSave={(updates) => {
                      updateGame.mutate({ id: game.id, ...updates });
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {game.home_team} x {game.away_team}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        ⏰ {game.game_time?.slice(0, 5)} • {game.competition}
                        {game.competition_detail ? ` · ${game.competition_detail}` : ""}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">
                        📺 {game.channels?.join(", ") || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {game.is_live && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold animate-pulse">
                          AO VIVO
                        </span>
                      )}
                      <button
                        onClick={() => handleToggleLive(game.id, game.is_live)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          game.is_live ? "bg-red-500/20 text-red-400" : "hover:bg-white/[0.06] text-muted-foreground"
                        }`}
                        title="Toggle Ao Vivo"
                      >
                        <Zap className="h-3.5 w-3.5" />
                      </button>
                      <Switch
                        checked={game.active}
                        onCheckedChange={() => handleToggleActive(game.id, game.active)}
                      />
                      <button onClick={() => setEditingId(game.id)} className="p-1 rounded hover:bg-white/[0.06] text-muted-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm("Excluir jogo?")) deleteGame.mutate(game.id); }}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const InlineEditForm = ({
  game,
  onSave,
  onCancel,
}: {
  game: any;
  onSave: (u: any) => void;
  onCancel: () => void;
}) => {
  const [home, setHome] = useState(game.home_team);
  const [away, setAway] = useState(game.away_team);
  const [comp, setComp] = useState(game.competition);
  const [time, setTime] = useState(game.game_time?.slice(0, 5) || "");
  const [channels, setChannels] = useState(game.channels?.join(", ") || "");

  return (
    <div className="flex-1 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Input value={home} onChange={(e) => setHome(e.target.value)} className="h-8 text-xs" />
        <Input value={away} onChange={(e) => setAway(e.target.value)} className="h-8 text-xs" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input value={comp} onChange={(e) => setComp(e.target.value)} className="h-8 text-xs" />
        <Input value={time} onChange={(e) => setTime(e.target.value)} className="h-8 text-xs" />
      </div>
      <Input value={channels} onChange={(e) => setChannels(e.target.value)} placeholder="Canais" className="h-8 text-xs" />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() =>
            onSave({
              home_team: home,
              away_team: away,
              competition: comp,
              game_time: time,
              channels: channels.split(",").map((c: string) => c.trim()).filter(Boolean),
            })
          }
          className="h-7 text-xs bg-emerald-600"
        >
          <Check className="h-3 w-3 mr-1" /> Salvar
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">
          <X className="h-3 w-3 mr-1" /> Cancelar
        </Button>
      </div>
    </div>
  );
};

const AddGameForm = ({
  date,
  onClose,
  insertGames,
}: {
  date: string;
  onClose: () => void;
  insertGames: any;
}) => {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [comp, setComp] = useState("");
  const [time, setTime] = useState("");
  const [channels, setChannels] = useState("");

  const handleAdd = async () => {
    if (!home || !away || !time) {
      toast.error("Preencha times e horário");
      return;
    }
    try {
      await insertGames.mutateAsync([
        {
          date,
          home_team: home,
          away_team: away,
          competition: comp,
          competition_detail: "",
          game_time: time,
          channels: channels.split(",").map((c) => c.trim()).filter(Boolean),
          is_live: false,
          is_womens: home.includes("(F)") || away.includes("(F)"),
          active: true,
        },
      ]);
      toast.success("Jogo adicionado!");
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="rounded-xl glass-panel p-4 space-y-3 border border-emerald-500/20">
      <p className="text-xs font-bold text-foreground">Adicionar Jogo Avulso</p>
      <div className="grid grid-cols-2 gap-2">
        <Input value={home} onChange={(e) => setHome(e.target.value)} placeholder="Time casa" className="h-8 text-xs" />
        <Input value={away} onChange={(e) => setAway(e.target.value)} placeholder="Time visitante" className="h-8 text-xs" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input value={comp} onChange={(e) => setComp(e.target.value)} placeholder="Competição" className="h-8 text-xs" />
        <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="HH:MM" className="h-8 text-xs" />
      </div>
      <Input value={channels} onChange={(e) => setChannels(e.target.value)} placeholder="Canais (vírgula)" className="h-8 text-xs" />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAdd} className="h-7 text-xs bg-emerald-600">
          <Plus className="h-3 w-3 mr-1" /> Adicionar
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} className="h-7 text-xs">
          Cancelar
        </Button>
      </div>
    </div>
  );
};
