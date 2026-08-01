import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAllDailyGames, useUpdateDailyGame, useDeleteDailyGame, useInsertDailyGames, useDeleteDailyGamesByDate, normalizeChannelsList } from "@/hooks/useDailyGames";
import { formatCountdown } from "@/lib/dateUtils";
import { detectSportType, SPORT_EMOJI, SPORT_LABEL, getLocalDateString, isNonAdversarial, type SportType } from "@/lib/gameUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { gameKey } from "@/lib/dedup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Pencil, Check, X, Plus, Loader2, Calendar, Clock, Archive, RefreshCw, ShieldCheck, Wand2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SPORT_OPTIONS = Object.keys(SPORT_LABEL) as SportType[];

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
  const [showSuspect, setShowSuspect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSport, setBulkSport] = useState<SportType>("football");
  const [pendingConfirm, setPendingConfirm] = useState<{ kind: "archive-day" | "clear-day" | "delete-game" | "remove-duplicates"; payload: any } | null>(null);

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

  // Pre-compute "suggested" sport for each game (for divergence highlight + suspect filter)
  const suggestionMap = useMemo(() => {
    const map = new Map<string, SportType>();
    if (!games) return map;
    for (const g of games) {
      map.set(g.id, detectSportType(g.competition || "", `${g.home_team} ${g.away_team}`));
    }
    return map;
  }, [games]);

  const suspectCount = useMemo(() => {
    if (!games) return 0;
    return games.filter((g) => suggestionMap.get(g.id) !== (g.sport_type || "football")).length;
  }, [games, suggestionMap]);

  const filteredGames = useMemo(() => {
    if (!games) return [];
    let list = games;
    if (sportFilter) list = list.filter((g) => (g.sport_type || "football") === sportFilter);
    if (showSuspect) list = list.filter((g) => suggestionMap.get(g.id) !== (g.sport_type || "football"));
    return list;
  }, [games, sportFilter, showSuspect, suggestionMap]);

  const handleToggleActive = (id: string, current: boolean) => {
    updateGame.mutate({ id, active: !current });
  };

  const handleQuickSportChange = (id: string, sport: SportType) => {
    updateGame.mutate({ id, sport_type: sport });
  };

  const handleAutoOne = (game: any) => {
    const correct = detectSportType(game.competition || "", `${game.home_team} ${game.away_team}`);
    if (correct === game.sport_type) {
      toast.info(`Já está como ${SPORT_LABEL[correct]}`);
      return;
    }
    updateGame.mutate({ id: game.id, sport_type: correct });
    toast.success(`${SPORT_EMOJI[correct]} ${SPORT_LABEL[correct]}`);
  };

  const handleDuplicateTomorrow = async (game: any) => {
    const d = new Date(`${game.date}T12:00:00`);
    d.setDate(d.getDate() + 1);
    const nextDate = d.toISOString().slice(0, 10);
    try {
      const result = await insertGames.mutateAsync([
        {
          date: nextDate,
          home_team: game.home_team,
          away_team: game.away_team,
          competition: game.competition || "",
          competition_detail: game.competition_detail || "",
          game_time: game.game_time,
          channels: game.channels || [],
          is_live: false,
          is_womens: !!game.is_womens,
          active: true,
          archived: false,
          sport_type: game.sport_type || "football",
          status_short: "NS",
          elapsed_minutes: null,
          publish_at: null,
        } as any,
      ]);
      if (result.skipped > 0) toast.warning(`Já existe em ${nextDate}`);
      else toast.success(`Duplicado para ${nextDate}`);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao duplicar");
    }
  };



  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkSport = async () => {
    if (selectedIds.size === 0) return;
    try {
      const { error } = await supabase
        .from("daily_games")
        .update({ sport_type: bulkSport })
        .in("id", Array.from(selectedIds));
      if (error) throw error;
      toast.success(`${selectedIds.size} jogo(s) alterado(s) para ${SPORT_EMOJI[bulkSport]} ${SPORT_LABEL[bulkSport]}`);
      clearSelection();
      queryClient.invalidateQueries({ queryKey: ["daily_games"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleArchiveDay = () => {
    const nonArchived = games?.filter((g) => !g.archived) || [];
    if (nonArchived.length === 0) {
      toast.info("Nenhum jogo para arquivar nesta data");
      return;
    }
    setPendingConfirm({ kind: "archive-day", payload: { count: nonArchived.length } });
  };

  const confirmRemoveDuplicates = async () => {
    if (!pendingConfirm || pendingConfirm.kind !== "remove-duplicates") return;
    const { ids, count } = pendingConfirm.payload;
    setPendingConfirm(null);
    try {
      const { error } = await supabase
        .from("daily_games")
        .delete()
        .in("id", ids);
      if (error) throw error;
      toast.success(`${count} duplicata(s) removida(s)!`);
      queryClient.invalidateQueries({ queryKey: ["daily_games"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const confirmArchiveDay = async () => {
    if (!pendingConfirm || pendingConfirm.kind !== "archive-day") return;
    setPendingConfirm(null);
    try {
      const { error } = await supabase
        .from("daily_games")
        .update({ archived: true, active: false } as any)
        .eq("date", selectedDate)
        .eq("archived", false);
      if (error) throw error;
      toast.success(`${pendingConfirm.payload.count} jogos arquivados!`);
      queryClient.invalidateQueries({ queryKey: ["daily_games"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const [reclassifying, setReclassifying] = useState(false);

  const handleReclassifySports = async () => {
    setReclassifying(true);
    try {
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

      const seen = new Map<string, string>();
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

      setPendingConfirm({ kind: "remove-duplicates", payload: { ids: dupeIds, count: dupeIds.length } });
    } catch (err: any) {
      toast.error(err.message || "Erro ao verificar duplicatas");
    } finally {
      setCheckingDupes(false);
    }
  };

  const handleClearDay = () => {
    setPendingConfirm({ kind: "clear-day", payload: {} });
  };

  const confirmClearDay = async () => {
    if (!pendingConfirm || pendingConfirm.kind !== "clear-day") return;
    setPendingConfirm(null);
    try {
      await deleteByDate.mutateAsync(selectedDate);
      toast.success("Jogos do dia removidos!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const activeCount = games?.filter((g) => g.active).length || 0;
  const scheduledCount = games?.filter((g) => g.publish_at && !g.active && new Date(g.publish_at) > new Date()).length || 0;

  const confirmTitle = pendingConfirm
    ? pendingConfirm.kind === "archive-day"
      ? `Arquivar ${pendingConfirm.payload.count} jogos?`
      : pendingConfirm.kind === "clear-day"
        ? `Excluir todos os jogos de ${selectedDate}?`
        : pendingConfirm.kind === "delete-game"
          ? "Excluir jogo?"
          : `Remover ${pendingConfirm.payload.count} duplicata(s)?`
    : "";

  const confirmDescription = pendingConfirm
    ? pendingConfirm.kind === "archive-day"
      ? "Os jogos serão arquivados e deixarão de aparecer na programação ativa."
      : pendingConfirm.kind === "clear-day"
        ? "Todos os jogos desta data serão excluídos permanentemente."
        : pendingConfirm.kind === "delete-game"
          ? "Este jogo será removido permanentemente."
          : "Será mantido o registro mais antigo e removidos os demais."
    : "";

  const handleConfirmAction = () => {
    if (!pendingConfirm) return;
    switch (pendingConfirm.kind) {
      case "archive-day": confirmArchiveDay(); break;
      case "clear-day": confirmClearDay(); break;
      case "delete-game": {
        const id = pendingConfirm.payload.id;
        setPendingConfirm(null);
        deleteGame.mutate(id, { onSuccess: () => toast.success("Jogo excluído!") });
        break;
      }
      case "remove-duplicates": confirmRemoveDuplicates(); break;
    }
  };

  return (
        <><div className="glass-panel rounded-2xl overflow-hidden">
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
            {suspectCount > 0 && (
              <button
                onClick={() => setShowSuspect((s) => !s)}
                className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors flex items-center gap-1 ${
                  showSuspect
                    ? "bg-amber-500/20 text-amber-300 font-bold"
                    : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                }`}
              >
                <AlertTriangle className="h-2.5 w-2.5" /> Suspeitos {suspectCount}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0 flex-wrap">
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
          <Button size="sm" variant="ghost" onClick={handleCheckDuplicates} disabled={checkingDupes} className="text-xs text-emerald-400 hover:text-emerald-300">
            {checkingDupes ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5 mr-1" />}
            Verificar duplicatas
          </Button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-5 sm:px-6 py-3 bg-primary/10 border-b border-primary/20 flex-wrap">
          <span className="text-xs font-bold text-primary">{selectedIds.size} selecionado(s)</span>
          <Select value={bulkSport} onValueChange={(v) => setBulkSport(v as SportType)}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[100] bg-popover">
              {SPORT_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {SPORT_EMOJI[s]} {SPORT_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleBulkSport} className="h-8 text-xs bg-primary text-primary-foreground">
            Aplicar esporte
          </Button>
          <Button size="sm" variant="ghost" onClick={clearSelection} className="h-8 text-xs">
            Limpar seleção
          </Button>
        </div>
      )}

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
              const currentSport = (game.sport_type || "football") as SportType;
              const suggested = suggestionMap.get(game.id) || currentSport;
              const isDivergent = suggested !== currentSport;
              const isSelected = selectedIds.has(game.id);
              return (
                <div
                  key={game.id}
                  className={`rounded-xl glass-panel p-3 flex gap-3 transition-all ${
                    editingId === game.id ? "items-start" : "items-center"
                  } ${
                    isArchived ? "opacity-30 border border-dashed border-muted-foreground/20" : !game.active && !isScheduled ? "opacity-40" : ""
                  } ${isDivergent && !isArchived ? "border border-amber-500/30" : ""} ${isSelected ? "ring-2 ring-primary/50" : ""}`}
                >
                  {editingId === game.id ? (
                    <InlineEditForm
                      game={game}
                      suggestedSport={suggested}
                      onSave={(updates) => {
                        if (Object.keys(updates).length === 0) {
                          setEditingId(null);
                          return;
                        }
                        updateGame.mutate(
                          { id: game.id, ...updates },
                          {
                            onSuccess: () => toast.success("Jogo atualizado"),
                            onError: (err: any) => toast.error(err?.message || "Erro ao salvar o jogo"),
                          }
                        );
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                    />

                  ) : (
                    <>
                      {!isArchived && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelected(game.id)}
                          className="shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-foreground truncate">
                            {game.away_team?.trim() ? `${game.home_team} x ${game.away_team}` : game.home_team}
                          </p>
                          <Badge className="bg-white/[0.06] text-muted-foreground border-white/[0.08] text-[9px] px-1.5 py-0 shrink-0">
                            {SPORT_EMOJI[currentSport]} {SPORT_LABEL[currentSport]}
                          </Badge>
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
                        {isDivergent && !isArchived && (
                          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Sugestão: {SPORT_EMOJI[suggested]} {SPORT_LABEL[suggested]}</span>
                            <button
                              onClick={() => handleQuickSportChange(game.id, suggested)}
                              className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold"
                            >
                              Aceitar
                            </button>
                          </div>
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
                            {/* Quick sport dropdown (1-click change) */}
                            <Select value={currentSport} onValueChange={(v) => handleQuickSportChange(game.id, v as SportType)}>
                              <SelectTrigger className="h-7 w-[110px] text-[10px] px-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[100] bg-popover">
                                {SPORT_OPTIONS.map((s) => (
                                  <SelectItem key={s} value={s} className="text-xs">
                                    {SPORT_EMOJI[s]} {SPORT_LABEL[s]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <button
                              onClick={() => handleAutoOne(game)}
                              title="Re-classificar este jogo"
                              className="p-1 rounded hover:bg-blue-500/10 text-blue-400"
                            >
                              <Wand2 className="h-3.5 w-3.5" />
                            </button>
                            <Switch
                              checked={game.active}
                              onCheckedChange={() => handleToggleActive(game.id, game.active)}
                            />
                            <button
                              onClick={() => handleDuplicateTomorrow(game)}
                              title="Duplicar para amanhã"
                              aria-label="Duplicar para amanhã"
                              className="p-1 rounded hover:bg-emerald-500/10 text-emerald-400"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setEditingId(game.id)} aria-label="Editar jogo" className="p-1 rounded hover:bg-white/[0.06] text-muted-foreground">

                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setPendingConfirm({ kind: "delete-game", payload: { id: game.id } })}
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

      <AlertDialog open={!!pendingConfirm} onOpenChange={(o) => !o && setPendingConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}
              className={pendingConfirm?.kind === "delete-game" || pendingConfirm?.kind === "clear-day" || pendingConfirm?.kind === "remove-duplicates" ? "bg-destructive hover:bg-destructive/90" : ""}>
              {pendingConfirm?.kind === "archive-day" ? "Arquivar" : pendingConfirm?.kind === "clear-day" ? "Excluir tudo" : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground">{label}</label>
    {children}
  </div>
);

/** ISO -> value for <input type="datetime-local"> in local time */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const InlineEditForm = ({
  game,
  suggestedSport,
  onSave,
  onCancel,
}: {
  game: any;
  suggestedSport?: SportType;
  onSave: (u: any) => void;
  onCancel: () => void;
}) => {
  const [home, setHome] = useState(game.home_team ?? "");
  const [away, setAway] = useState(game.away_team ?? "");
  const [comp, setComp] = useState(game.competition ?? "");
  const [detail, setDetail] = useState(game.competition_detail ?? "");
  const [date, setDate] = useState(game.date ?? "");
  const [time, setTime] = useState(game.game_time?.slice(0, 5) || "");
  const [channels, setChannels] = useState(game.channels?.join(", ") || "");
  const [sport, setSport] = useState<SportType>((game.sport_type || "football") as SportType);
  const [active, setActive] = useState(!!game.active);
  const [isLive, setIsLive] = useState(!!game.is_live);
  const [isWomens, setIsWomens] = useState(!!game.is_womens);
  const [publishAt, setPublishAt] = useState(toLocalInput(game.publish_at));

  const trimmedHome = home.trim();
  const trimmedAway = away.trim();
  const nonAdversarial = isNonAdversarial(sport);
  // Evento único: sem adversário. Ligado por padrão quando o jogo já não tem visitante.
  const [singleEvent, setSingleEvent] = useState(!((game.away_team ?? "").trim()));
  const validTime = /^\d{2}:\d{2}$/.test(time);
  const error = !trimmedHome
    ? (nonAdversarial || singleEvent ? "Informe o nome do evento." : "Informe o time da casa.")
    : !validTime
      ? "Informe um horário válido (HH:MM)."
      : null;


  const buildUpdates = () => {
    const next: Record<string, any> = {};
    const nextChannels = normalizeChannelsList(channels);
    const currentChannels: string[] = game.channels || [];
    const publishIso = publishAt ? new Date(publishAt).toISOString() : null;

    if (trimmedHome !== game.home_team) next.home_team = trimmedHome;
    const effectiveAway = singleEvent ? "" : trimmedAway;
    if (effectiveAway !== (game.away_team ?? "")) next.away_team = effectiveAway;
    if (comp.trim() !== (game.competition ?? "")) next.competition = comp.trim();
    if (detail.trim() !== (game.competition_detail ?? "")) next.competition_detail = detail.trim();
    if (date !== game.date) next.date = date;
    if (time !== game.game_time?.slice(0, 5)) next.game_time = time;
    if (nextChannels.join("|") !== currentChannels.join("|")) next.channels = nextChannels;
    if (sport !== (game.sport_type || "football")) next.sport_type = sport;
    if (active !== !!game.active) next.active = active;
    if (isLive !== !!game.is_live) {
      next.is_live = isLive;
      next.status_short = isLive ? "LIVE" : "NS";
      if (!isLive) next.elapsed_minutes = null;
    }
    if (isWomens !== !!game.is_womens) next.is_womens = isWomens;
    if (publishIso !== (game.publish_at ?? null)) next.publish_at = publishIso;
    return next;
  };

  const isDirty = Object.keys(buildUpdates()).length > 0;

  const handleSave = () => {
    if (error) return;
    onSave(buildUpdates());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="flex-1 min-w-0 space-y-3" onKeyDown={handleKeyDown}>
      <label className="flex items-center justify-between gap-2 min-h-11 rounded-lg border border-white/[0.06] px-3">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Evento único (sem confronto)
        </span>
        <Switch
          checked={singleEvent}
          onCheckedChange={(v) => {
            setSingleEvent(v);
            if (v) setAway("");
          }}
          aria-label="Evento único (sem confronto)"
        />
      </label>

      <div className={`grid grid-cols-1 gap-2 ${singleEvent ? "" : "sm:grid-cols-2"}`}>
        <Field label={singleEvent || nonAdversarial ? "Evento / prova" : "Time casa"}>
          <Input
            value={home}
            onChange={(e) => setHome(e.target.value)}
            maxLength={120}
            placeholder={singleEvent || nonAdversarial ? "Ex.: GP do Brasil · UFC 300 · Kings League" : "Ex.: Flamengo"}
            className="h-11 text-sm"
          />
        </Field>
        {!singleEvent && (
          <Field label="Time visitante (opcional)">
            <Input
              value={away}
              onChange={(e) => setAway(e.target.value)}
              maxLength={120}
              placeholder="Deixe vazio para evento único"
              className="h-11 text-sm"
            />
          </Field>
        )}
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Field label="Competição">
          <Input value={comp} onChange={(e) => setComp(e.target.value)} maxLength={120} className="h-11 text-sm" />
        </Field>
        <Field label="Detalhe / fase">
          <Input value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={120} placeholder="Ex.: 12ª rodada" className="h-11 text-sm" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Field label="Data">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 text-sm" />
        </Field>
        <Field label="Horário">
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11 text-sm" />
        </Field>
      </div>

      <Field label="Canais (separados por vírgula)">
        <Input value={channels} onChange={(e) => setChannels(e.target.value)} maxLength={300} placeholder="Globo, SporTV" className="h-11 text-sm" />
      </Field>

      <Field label="Esporte">
        <Select value={sport} onValueChange={(v) => setSport(v as SportType)}>
          <SelectTrigger className="h-11 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[100] bg-popover">
            {SPORT_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="text-sm">
                {SPORT_EMOJI[s]} {SPORT_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {suggestedSport && suggestedSport !== sport && (
        <button
          type="button"
          onClick={() => setSport(suggestedSport)}
          className="flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 min-h-11"
        >
          <Wand2 className="h-3 w-3" />
          Usar sugestão: {SPORT_EMOJI[suggestedSport]} {SPORT_LABEL[suggestedSport]}
        </button>
      )}

      <Field label="Agendar publicação (opcional)">
        <div className="flex items-center gap-2">
          <Input
            type="datetime-local"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
            className="h-11 text-sm"
          />
          {publishAt && (
            <Button size="sm" variant="ghost" onClick={() => setPublishAt("")} className="min-h-11 text-xs shrink-0">
              Limpar
            </Button>
          )}
        </div>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          { label: "Ativo", value: active, set: setActive },
          { label: "Ao vivo", value: isLive, set: setIsLive },
          { label: "Feminino", value: isWomens, set: setIsWomens },
        ].map((s) => (
          <label key={s.label} className="flex items-center justify-between gap-2 min-h-11 rounded-lg border border-white/[0.06] px-3">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
            <Switch checked={s.value} onCheckedChange={(v) => s.set(v)} aria-label={s.label} />
          </label>
        ))}
      </div>

      {error && (
        <p className="text-[11px] text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!!error || !isDirty}
          className="min-h-11 text-xs bg-emerald-600 hover:bg-emerald-600/90"
        >
          <Check className="h-3 w-3 mr-1" /> Salvar
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="min-h-11 text-xs">
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
  const [sportMode, setSportMode] = useState<"auto" | SportType>("auto");

  const handleAdd = async () => {
    const trimmedHome = home.trim();
    const trimmedAway = away.trim();
    if (!trimmedHome || !/^\d{2}:\d{2}$/.test(time)) {
      toast.error("Preencha o evento/time e o horário (HH:MM)");
      return;
    }

    const resolvedSport: SportType =
      sportMode === "auto"
        ? detectSportType(comp, `${trimmedHome} ${trimmedAway}`.trim())
        : sportMode;

    try {
      const result = await insertGames.mutateAsync([
        {
          date,
          home_team: trimmedHome,
          away_team: trimmedAway,
          competition: comp,
          competition_detail: "",
          game_time: time,
          channels: channels.split(",").map((c) => c.trim()).filter(Boolean),
          is_live: false,
          is_womens: trimmedHome.includes("(F)") || trimmedAway.includes("(F)"),
          active: true,
          archived: false,
          sport_type: resolvedSport,
          status_short: "NS",
        },
      ]);
      if (result.skipped > 0) {
        toast.warning("Jogo já existe — não foi adicionado");
      } else {
        toast.success(trimmedAway ? "Jogo adicionado!" : "Evento adicionado!");
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="rounded-xl glass-panel p-4 space-y-3 border border-emerald-500/20">
      <p className="text-xs font-bold text-foreground">Adicionar Jogo / Evento Avulso</p>
      <div className="grid grid-cols-2 gap-2">
        <Input value={home} onChange={(e) => setHome(e.target.value)} placeholder="Time casa / Evento" className="h-8 text-xs" />
        <Input value={away} onChange={(e) => setAway(e.target.value)} placeholder="Visitante (vazio = evento)" className="h-8 text-xs" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input value={comp} onChange={(e) => setComp(e.target.value)} placeholder="Competição" className="h-8 text-xs" />
        <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="HH:MM" className="h-8 text-xs" />
      </div>
      <Input value={channels} onChange={(e) => setChannels(e.target.value)} placeholder="Canais (vírgula)" className="h-8 text-xs" />
      <Select value={sportMode} onValueChange={(v) => setSportMode(v as any)}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-[100] bg-popover">
          <SelectItem value="auto" className="text-xs">🪄 Auto (detectar)</SelectItem>
          {SPORT_OPTIONS.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">
              {SPORT_EMOJI[s]} {SPORT_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
