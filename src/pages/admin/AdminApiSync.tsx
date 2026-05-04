import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Download, Radio, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getLocalDateString } from "@/lib/gameUtils";

const AdminApiSync = () => {
  const qc = useQueryClient();
  const [date, setDate] = useState(getLocalDateString());
  const [busy, setBusy] = useState<null | "fetch" | "live">(null);
  const [lastResult, setLastResult] = useState<any>(null);

  const { data: apiGames, refetch } = useQuery({
    queryKey: ["api-football-games"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_games")
        .select("id, date, game_time, home_team, away_team, competition, status_short, is_live, external_id")
        .eq("source", "api-football")
        .order("date", { ascending: false })
        .order("game_time", { ascending: true })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const callFn = async (name: "fetch-games" | "update-live-games", params: Record<string, string> = {}) => {
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
      const res = await callFn("fetch-games", { date });
      setLastResult(res);
      if (res.error) toast.error(res.error);
      else if (res.upserted > 0) toast.success(`${res.upserted} jogo(s) sincronizados`);
      else if (res.errors?.length) {
        toast.error(`API retornou erro: ${res.errors[0]}`, { duration: 8000 });
      } else {
        toast.warning(`Nenhum jogo encontrado para ${date} nas ligas configuradas`);
      }
      qc.invalidateQueries({ queryKey: ["daily_games"] });
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const handleLive = async () => {
    setBusy("live");
    try {
      const res = await callFn("update-live-games");
      setLastResult(res);
      if (res.error) toast.error(res.error);
      else toast.success(res.skipped ? "Sem jogos da API hoje" : `${res.updated} jogo(s) atualizados`);
      qc.invalidateQueries({ queryKey: ["daily_games"] });
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("daily_games").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Removido");
      refetch();
      qc.invalidateQueries({ queryKey: ["daily_games"] });
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="glass-panel rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Download className="h-4 w-4 text-emerald-400" />
          Buscar jogos do dia (API-Football)
        </h3>
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10" />
          </div>
          <Button onClick={handleFetch} disabled={busy !== null} className="min-h-[44px]">
            {busy === "fetch" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span className="ml-2">Buscar</span>
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/70">
          Brasileirão A/B, Copa do Brasil, Libertadores, Sul-Americana, Carioca, Paulistão.
        </p>
      </div>

      <div className="glass-panel rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Radio className="h-4 w-4 text-amber-400" />
          Atualizar status ao vivo agora
        </h3>
        <Button onClick={handleLive} disabled={busy !== null} variant="outline" className="min-h-[44px] w-full">
          {busy === "live" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Atualizar</span>
        </Button>
        <p className="text-[10px] text-muted-foreground/70">Roda automaticamente a cada 5 min via cron.</p>
      </div>

      {lastResult && (
        <pre className="glass-panel rounded-xl p-3 text-[10px] text-muted-foreground overflow-x-auto">
          {JSON.stringify(lastResult, null, 2)}
        </pre>
      )}

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Últimos jogos sincronizados</h3>
          <span className="text-[10px] text-muted-foreground">{apiGames?.length || 0} de 50</span>
        </div>
        <div className="divide-y divide-white/[0.04] max-h-[400px] overflow-y-auto">
          {(apiGames || []).map((g) => (
            <div key={g.id} className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {g.home_team} × {g.away_team}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {g.date} • {g.game_time?.slice(0, 5)} • {g.competition} • {g.status_short}
                  {g.is_live && <span className="ml-1 text-amber-400">● AO VIVO</span>}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(g.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                aria-label="Remover"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {!apiGames?.length && (
            <p className="p-6 text-center text-xs text-muted-foreground">
              Nenhum jogo sincronizado ainda. Clique em "Buscar" acima.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminApiSync;
