import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAllDailyGames, useUpdateDailyGame, useDeleteDailyGame, useInsertDailyGames, useDeleteDailyGamesByDate } from "@/hooks/useDailyGames";
import { formatCountdown } from "@/lib/dateUtils";
import { detectSportType, SPORT_EMOJI, getLocalDateString, type SportType } from "@/lib/gameUtils";
import { gameKey } from "@/lib/dedup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil, Check, X, Plus, Loader2, Calendar, Clock, Archive, RefreshCw, ShieldCheck, Radio, Link2, Link2Off } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const DailyGamesManager = () => {
  const today = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const queryClient = useQueryClient();
  const { data: games, isLoading } = useAllDailyGames(selectedDate);
  const updateGame = useUpdateDailyGame();
  const deleteGame = useDeleteDailyGame();
  const deleteByDate = useDeleteDailyGamesByDate();
  const insertGames = useInsertDailyGames();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sportFilter, setSportFilter] = useState<string | null>(null);

  // Live countdown tick
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Sport counts
  const sportCounts = useMemo(() => {
    if (!games) return {};
    return games.reduce<Record<string, number>>((acc, g) => {
      const st = g.sport_type || "football";
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {});
  }, [games]);

  const filteredGames = useMemo(() => {
    if (!games) return [];
    if (!sportFilter) return games;
    return games.filter((g) => (g.sport_type || "football") === sportFilter);
  }, [games, sportFilter]);

  const handleToggleActive = (id: string, current: boolean) => {
    updateGame.mutate({ id, active: !current });
  };

  const handleMatchTSDB = async (gameId: string) => {
    const t = toast.loading("Buscando placar (TheSportsDB)...");
    try {
      const { data, error } = await supabase.functions.invoke("tsdb-match-game", { body: { gameId } });
      if (error) throw error;
      if (data?.matched) {
        toast.success("Vinculado! Placar/tempo serão atualizados em ~1 min.", { id: t });
        queryClient.invalidateQueries({ queryKey: ["daily_games"] });
      } else if (data?.candidates?.length) {
        const top = data.candidates[0];
        if (confirm(`Sem match automático.\nUsar candidato mais provável?\n\n${top.home} vs ${top.away}\n${top.league} • score ${(top.score * 100).toFixed(0)}%`)) {
          await supabase.from("daily_games").update({ external_id: `tsdb:${top.id}` }).eq("id", gameId);
          toast.success("Vinculado manualmente.", { id: t });
          queryClient.invalidateQueries({ queryKey: ["daily_games"] });
        } else {
          toast.dismiss(t);
        }
      } else {
        toast.error("Nenhum candidato encontrado na TheSportsDB", { id: t });
      }
    } catch (e: any) {
      toast.error(`Erro: ${e?.message || e}`, { id: t });
    }
  };

  const handleUnlinkTSDB = async (gameId: string) => {
    await supabase.from("daily_games").update({
      external_id: null, home_score: null, away_score: null, live_status: null,
    }).eq("id", gameId);
    toast.success("Desvinculado");
    queryClient.invalidateQueries({ queryKey: ["daily_games"] });
  };

  const handleRefreshLive = async () => {
    const t = toast.loading("Atualizando placares ao vivo...");
    try {
      const { data, error } = await supabase.functions.invoke("tsdb-live-update", { body: {} });
      if (error) throw error;
      toast.success(`${data?.updated ?? 0} jogos atualizados`, { id: t });
      queryClient.invalidateQueries({ queryKey: ["daily_games"] });
    } catch (e: any) {
      toast.error(`Erro: ${e?.message || e}`, { id: t });
    }
  };

  const handleMatchAllDay = async () => {
    const pending = (games || []).filter((g) => !g.external_id && !g.archived);
    if (pending.length === 0) {
      toast.info("Todos os jogos do dia já estão vinculados");
      return;
    }
    if (!confirm(`Tentar vincular ${pending.length} jogo(s) do dia à TheSportsDB?`)) return;
    const t = toast.loading(`Vinculando 0/${pending.length}...`);
    let matched = 0;
    let i = 0;
    for (const g of pending) {
      i++;
      toast.loading(`Vinculando ${i}/${pending.length}...`, { id: t });
      try {
        const { data } = await supabase.functions.invoke("tsdb-match-game", { body: { gameId: g.id } });
        if (data?.matched) matched++;
      } catch (_) { /* silencioso */ }
    }
    toast.success(`📡 ${matched}/${pending.length} jogo(s) vinculados`, { id: t });
    queryClient.invalidateQueries({ queryKey: ["daily_games"] });
    if (matched > 0) {
      supabase.functions.invoke("tsdb-live-update", { body: {} }).catch(() => {});
    }
  };


  const handleArchiveDay = async () => {
    const nonArchived = games?.filter((g) => !g.archived) || [];
    if (nonArchived.length === 0) {
      toast.info("Nenhum jogo para arquivar nesta data");
      return;
    }
    if (!confirm(`Arquivar todos os ${nonArchived.length} jogos de ${selectedDate}?`)) return;
    try {
      const { error } = await supabase
        .from("daily_games")
        .update({ archived: true, active: false } as any)
        .eq("date", selectedDate)
        .eq("archived", false);
      if (error) throw error;
      toast.success(`${nonArchived.length} jogos arquivados!`);
      queryClient.invalidateQueries({ queryKey: ["daily_games"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const [reclassifying, setReclassifying] = useState(false);

  const handleReclassifySports = async () => {
    setReclassifying(true);
    try {
      // Fetch ALL non-archived games (no date filter)
      const { data: allGames, error } = await supabase
        .from("daily_games")
        .select("id, home_team, away_team, competition, sport_type")
        .eq("archived", false);

      if (error) throw error;
      if (!allGames || allGames.length === 0) {
        toast.info("Nenhum jogo encontrado para re-classificar");
        return;
      }

      let updated = 0;
      for (const g of allGames) {
        const correct = detectSportType(g.competition, `${g.home_team} ${g.away_team}`);
        if (correct !== g.sport_type) {
          const { error: upErr } = await supabase
            .from("daily_games")
            .update({ sport_type: correct })
            .eq("id", g.id);
          if (!upErr) updated++;
        }
      }

      if (updated === 0) {
        toast.success("Todos os jogos já estão classificados corretamente!");
      } else {
        toast.success(`${updated} jogo(s) re-classificado(s)!`);
        queryClient.invalidateQueries({ queryKey: ["daily_games"] });
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao re-classificar");
    } finally {
      setReclassifying(false);
    }
  };

  const [checkingDupes, setCheckingDupes] = useState(false);
  const handleCheckDuplicates = async () => {
    setCheckingDupes(true);
    try {
      const { data, error } = await supabase
        .from("daily_games")
        .select("id, date, home_team, away_team, game_time, sport_type, created_at")
        .eq("archived", false)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const seen = new Map<string, string>(); // key -> id of oldest
      const dupeIds: string[] = [];
      for (const g of data || []) {
        const key = gameKey(g as any) + "|" + g.date;
        if (seen.has(key)) {
          dupeIds.push(g.id);
        } else {
          seen.set(key, g.id);
        }
      }

      if (dupeIds.length === 0) {
        toast.success("Nenhuma duplicata encontrada — banco limpo!");
        return;
      }

      if (!confirm(`${dupeIds.length} duplicata(s) encontrada(s). Manter o registro mais antigo e remover os demais?`)) return;

      const { error: delErr } = await supabase.from("daily_games").delete().in("id", dupeIds);
      if (delErr) throw delErr;
      toast.success(`${dupeIds.length} duplicata(s) removida(s)!`);
      queryClient.invalidateQueries({ queryKey: ["daily_games"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao verificar duplicatas");
    } finally {
      setCheckingDupes(false);
    }
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
  const scheduledCount = games?.filter((g) => g.publish_at && !g.active && new Date(g.publish_at) > new Date()).length || 0;

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 sm:p-6 border-b border-white/[0.06]">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Calendar className="h-4 w-4 text-emerald-400" />
            Jogos Publicados
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-emerald-400 font-semibold">{activeCount} ativos</span>
            {scheduledCount > 0 && (
              <span className="text-xs text-amber-400 font-semibold">{scheduledCount} agendados</span>
            )}
            <span className="text-xs text-muted-foreground/50">{games?.length || 0} total</span>
            {Object.entries(sportCounts).map(([sport, count]) => (
              <button
                key={sport}
                onClick={() => setSportFilter(sportFilter === sport ? null : sport)}
                className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                  sportFilter === sport
                    ? "bg-primary/20 text-primary font-bold"
                    : "bg-white/[0.06] text-muted-foreground hover:bg-white/[0.1]"
                }`}
              >
                {SPORT_EMOJI[sport as SportType] || "⚽"} {count}
              </button>
            ))}
          </div>
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
          <Button size="sm" variant="ghost" onClick={handleArchiveDay} className="text-xs text-amber-400 hover:text-amber-300">
            <Archive className="h-3.5 w-3.5 mr-1" /> Arquivar Dia
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClearDay} className="text-xs text-destructive">
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Limpar Dia
          </Button>
          <Button size="sm" variant="ghost" onClick={handleReclassifySports} disabled={reclassifying} className="text-xs text-blue-400 hover:text-blue-300">
            {reclassifying ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
            Re-classificar
          </Button>
          <Button size="sm" variant="ghost" onClick={handleMatchAllDay} className="text-xs text-emerald-400 hover:text-emerald-300">
            <Link2 className="h-3.5 w-3.5 mr-1" /> Vincular dia (TSDB)
          </Button>
          <Button size="sm" variant="ghost" onClick={handleRefreshLive} className="text-xs text-fuchsia-400 hover:text-fuchsia-300">
            <Radio className="h-3.5 w-3.5 mr-1" /> Atualizar placares
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCheckDuplicates} disabled={checkingDupes} className="text-xs text-emerald-400 hover:text-emerald-300">
            {checkingDupes ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5 mr-1" />}
            Verificar duplicatas
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
            {filteredGames.map((game) => {
              const isScheduled = game.publish_at && !game.active && new Date(game.publish_at) > new Date();
              const isArchived = game.archived;
              return (
                <div
                  key={game.id}
                  className={`rounded-xl glass-panel p-3 flex items-center gap-3 transition-all ${
                    isArchived ? "opacity-30 border border-dashed border-muted-foreground/20" : !game.active && !isScheduled ? "opacity-40" : ""
                  }`}
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
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground truncate">
                            {game.home_team} x {game.away_team}
                          </p>
                          {isArchived && (
                            <Badge className="bg-muted/50 text-muted-foreground border-muted text-[9px] px-1.5 py-0 shrink-0">
                              Arquivado
                            </Badge>
                          )}
                          {isScheduled && (
                            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-[9px] px-1.5 py-0 shrink-0">
                              <Clock className="h-2.5 w-2.5 mr-0.5" />
                              {formatCountdown(game.publish_at!)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          ⏰ {game.game_time?.slice(0, 5)} • {game.competition}
                          {game.competition_detail ? ` · ${game.competition_detail}` : ""}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60">
                          📺 {game.channels?.join(", ") || "—"}
                        </p>
                        {(game.external_id || game.home_score != null) && (
                          <p className="text-[10px] mt-0.5 flex items-center gap-1.5">
                            {game.external_id ? (
                              <span className="text-emerald-400 inline-flex items-center gap-1">
                                <Link2 className="h-3 w-3" /> TSDB
                              </span>
                            ) : null}
                            {game.home_score != null && game.away_score != null && (
                              <span className="text-fuchsia-300 font-bold tabular-nums">
                                {game.home_score} × {game.away_score}
                                {game.status_short ? ` · ${game.status_short}` : ""}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isArchived ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateGame.mutate({ id: game.id, archived: false, active: true })}
                            className="h-7 text-xs text-primary"
                          >
                            Desarquivar
                          </Button>
                        ) : (
                          <>
                            {game.external_id ? (
                              <button
                                onClick={() => handleUnlinkTSDB(game.id)}
                                className="p-1 rounded hover:bg-white/[0.06] text-emerald-400"
                                title="Desvincular TheSportsDB"
                              >
                                <Link2Off className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleMatchTSDB(game.id)}
                                className="p-1 rounded hover:bg-white/[0.06] text-fuchsia-400"
                                title="Buscar placar (TheSportsDB)"
                              >
                                <Radio className="h-3.5 w-3.5" />
                              </button>
                            )}
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
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
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

    // Check for duplicates before inserting
    const newGame = {
      home_team: home,
      away_team: away,
      game_time: time,
    };

    try {
      const result = await insertGames.mutateAsync([
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
          archived: false,
          sport_type: detectSportType(comp, `${home} ${away}`),
          status_short: "NS",
        },
      ]);
      if (result.skipped > 0) {
        toast.warning("Jogo já existe — não foi adicionado");
      } else {
        toast.success("Jogo adicionado!");
      }
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
        <Button size="sm" onClick={handleAdd} disabled={insertGames.isPending} className="h-7 text-xs bg-emerald-600">
          <Plus className="h-3 w-3 mr-1" /> {insertGames.isPending ? "Adicionando..." : "Adicionar"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} className="h-7 text-xs">
          Cancelar
        </Button>
      </div>
    </div>
  );
};
