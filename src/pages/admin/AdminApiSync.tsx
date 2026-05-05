import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Download, Radio, Trash2, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { getLocalDateString } from "@/lib/gameUtils";
import { useSettings, useUpdateSetting } from "@/hooks/useSettings";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SPORTS_OPTIONS = [
  "Soccer", "Basketball", "Tennis", "Motorsport", "Fighting",
  "Volleyball", "Ice Hockey", "Baseball", "American Football", "Golf", "Cycling",
];

const AdminApiSync = () => {
  const qc = useQueryClient();
  const { data: settings } = useSettings();
  const isPaused = (settings?.api_sync_paused ?? "true") !== "false";
  const [toggling, setToggling] = useState(false);
  const [date, setDate] = useState(getLocalDateString());
  const [busy, setBusy] = useState<null | "fetch" | "live">(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>(SPORTS_OPTIONS);
  const [withTV, setWithTV] = useState(true);

  const handleToggleSync = async (next: boolean) => {
    setToggling(true);
    try {
      const { data, error } = await supabase.rpc("set_api_sync_paused" as any, { _paused: next });
      if (error) throw error;
      toast.success(next ? "Sincronização pausada" : "Sincronização reativada");
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["daily_games"] });
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao alternar sincronização");
    } finally {
      setToggling(false);
    }
  };


const AdminApiSync = () => {
  const qc = useQueryClient();
  const [date, setDate] = useState(getLocalDateString());
  const [busy, setBusy] = useState<null | "fetch" | "live">(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>(SPORTS_OPTIONS);
  const [withTV, setWithTV] = useState(true);

  const { data: apiGames, refetch } = useQuery({
    queryKey: ["thesportsdb-games"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_games")
        .select("id, date, game_time, home_team, away_team, competition, status_short, is_live, external_id, sport_type, channels")
        .eq("source", "thesportsdb")
        .order("date", { ascending: false })
        .order("game_time", { ascending: true })
        .limit(80);
      if (error) throw error;
      return data;
    },
  });

  const callFn = async (name: string, params: Record<string, string> = {}) => {
    const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const r = await fetch(url, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    });
    return r.json();
  };

  const handleFetch = async () => {
    setBusy("fetch");
    try {
      const res = await callFn("sync-thesportsdb", {
        date,
        sports: selected.join(","),
        tv: withTV ? "true" : "false",
      });
      setLastResult(res);
      if (res.error) toast.error(res.error);
      else if (res.upserted > 0) toast.success(`${res.upserted} evento(s) sincronizados`);
      else toast.warning(`Nenhum evento encontrado para ${date}`);
      qc.invalidateQueries({ queryKey: ["daily_games"] });
      refetch();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  const handleLive = async () => {
    setBusy("live");
    try {
      const res = await callFn("update-live-thesportsdb");
      setLastResult(res);
      if (res.error) toast.error(res.error);
      else toast.success(res.skipped ? "Sem jogos hoje" : `${res.updated} jogo(s) atualizados`);
      qc.invalidateQueries({ queryKey: ["daily_games"] });
      refetch();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("daily_games").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removido"); refetch(); qc.invalidateQueries({ queryKey: ["daily_games"] }); }
  };

  const toggleSport = (s: string) => {
    setSelected((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-200 leading-relaxed">
        <strong className="block text-amber-300 mb-1">⚠️ Sincronização automática pausada</strong>
        Os jogos vindos das APIs (TheSportsDB / API-Football) estão temporariamente desligados porque os canais de transmissão BR não vinham confiáveis. A agenda pública mostra apenas jogos inseridos manualmente. Você ainda pode clicar em <em>Buscar</em> abaixo para testes — mas eles ficarão ocultos do site até reativarmos.
      </div>
      <div className="glass-panel rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Download className="h-4 w-4 text-emerald-400" />
          Sincronizar TheSportsDB
        </h3>

        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10" />
          </div>
          <Button onClick={handleFetch} disabled={busy !== null || selected.length === 0} className="min-h-[44px]">
            {busy === "fetch" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span className="ml-2">Buscar</span>
          </Button>
        </div>

        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Esportes ({selected.length}/{SPORTS_OPTIONS.length})</Label>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {SPORTS_OPTIONS.map((s) => {
              const on = selected.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSport(s)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border transition ${
                    on
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200"
                      : "bg-white/[0.04] border-white/10 text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={withTV} onChange={(e) => setWithTV(e.target.checked)} className="accent-emerald-500" />
          Buscar canais de TV automaticamente (mais lento, +1 req por evento)
        </label>

        <p className="text-[10px] text-muted-foreground/70">
          Cobre futebol, NBA, tênis, F1, MMA, vôlei, NHL, MLB, NFL, golfe e ciclismo. Cron diário 06:00 BRT.
        </p>
      </div>

      <div className="glass-panel rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Radio className="h-4 w-4 text-amber-400" />
          Atualizar status ao vivo (livescore)
        </h3>
        <Button onClick={handleLive} disabled={busy !== null} variant="outline" className="min-h-[44px] w-full">
          {busy === "live" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Atualizar agora</span>
        </Button>
        <p className="text-[10px] text-muted-foreground/70">Roda automaticamente a cada 5 min via cron.</p>
      </div>

      {lastResult && (
        <pre className="glass-panel rounded-xl p-3 text-[10px] text-muted-foreground overflow-x-auto max-h-64">
          {JSON.stringify(lastResult, null, 2)}
        </pre>
      )}

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Últimos eventos sincronizados</h3>
          <span className="text-[10px] text-muted-foreground">{apiGames?.length || 0} de 80</span>
        </div>
        <div className="divide-y divide-white/[0.04] max-h-[400px] overflow-y-auto">
          {(apiGames || []).map((g) => (
            <div key={g.id} className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {g.home_team} {g.away_team !== "—" && `× ${g.away_team}`}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {g.date} • {g.game_time?.slice(0, 5)} • {g.sport_type} • {g.competition}
                  {g.is_live && <span className="ml-1 text-amber-400">● AO VIVO</span>}
                </p>
                {g.channels?.length > 0 && (
                  <p className="text-[9px] text-emerald-400/70 truncate">📺 {g.channels.join(", ")}</p>
                )}
              </div>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(g.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Remover">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {!apiGames?.length && (
            <p className="p-6 text-center text-xs text-muted-foreground">
              Nenhum evento sincronizado. Clique em "Buscar" acima.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminApiSync;
