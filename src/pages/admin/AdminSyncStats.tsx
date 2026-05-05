import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Calendar, Tv, Radio, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TvStat = { events_with_tv: number; br_channels: number; events_with_br: number };
type SyncPayload = {
  source?: string;
  date?: string;
  sports?: number;
  perSport?: Record<string, number>;
  upserted?: number;
  skipped?: number;
  errors_count?: number;
  errors?: string[];
  triggered_by?: string;
  tv_stats_by_date?: Record<string, TvStat>;
  candidate_dates?: string[];
};

type AuditRow = {
  id: string;
  created_at: string;
  payload: SyncPayload;
};

export default function AdminSyncStats() {
  const [loading, setLoading] = useState(true);
  const [last, setLast] = useState<AuditRow | null>(null);
  const [history, setHistory] = useState<AuditRow[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("audit_logs")
      .select("id, created_at, payload")
      .eq("action", "api_sync_run")
      .order("created_at", { ascending: false })
      .limit(20);
    const rows = (data || []) as AuditRow[];
    setLast(rows[0] || null);
    setHistory(rows);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const tvStats = last?.payload?.tv_stats_by_date || {};
  const sortedDates = Object.keys(tvStats).sort();

  const totalEventsTv = sortedDates.reduce((s, d) => s + (tvStats[d]?.events_with_tv || 0), 0);
  const totalBrChannels = sortedDates.reduce((s, d) => s + (tvStats[d]?.br_channels || 0), 0);
  const totalEventsBr = sortedDates.reduce((s, d) => s + (tvStats[d]?.events_with_br || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-bold">Estatísticas de Sync</h1>
          <p className="text-xs text-muted-foreground">
            Eventos e canais BR encontrados por data na última execução do sync TheSportsDB.
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {!last ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {loading ? "Carregando…" : "Nenhuma execução de sync registrada ainda."}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Header da última execução */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Última execução
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {format(new Date(last.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                </Badge>
                <Badge variant="secondary">
                  {formatDistanceToNow(new Date(last.created_at), { addSuffix: true, locale: ptBR })}
                </Badge>
                <Badge variant="outline">
                  Trigger: {last.payload.triggered_by || "?"}
                </Badge>
                <Badge variant="outline">
                  Data alvo: {last.payload.date || "?"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <Stat label="Esportes" value={last.payload.sports ?? 0} />
                <Stat label="Upserted" value={last.payload.upserted ?? 0} highlight />
                <Stat label="Skipped" value={last.payload.skipped ?? 0} />
                <Stat label="Erros" value={last.payload.errors_count ?? 0} danger={(last.payload.errors_count ?? 0) > 0} />
              </div>
            </CardContent>
          </Card>

          {/* Totais TV */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Tv className="h-4 w-4 text-emerald-400" />
                Totais TV (todas as datas consultadas)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Eventos c/ TV" value={totalEventsTv} />
                <Stat label="Eventos c/ BR" value={totalEventsBr} highlight />
                <Stat label="Canais BR" value={totalBrChannels} />
              </div>
            </CardContent>
          </Card>

          {/* Por data */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-400" />
                Por data consultada
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sortedDates.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                  Sem stats de TV no payload.
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {sortedDates.map((d) => {
                    const s = tvStats[d];
                    const noBr = s.br_channels === 0;
                    return (
                      <div key={d} className="px-4 py-3 grid grid-cols-4 gap-2 items-center text-xs">
                        <div className="font-mono font-semibold">{d}</div>
                        <div>
                          <div className="text-[10px] uppercase text-muted-foreground">Eventos TV</div>
                          <div className="font-bold">{s.events_with_tv}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-muted-foreground">Eventos BR</div>
                          <div className={`font-bold ${noBr ? "text-destructive" : "text-emerald-400"}`}>
                            {s.events_with_br}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-muted-foreground">Canais BR</div>
                          <div className={`font-bold ${noBr ? "text-destructive" : ""}`}>{s.br_channels}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Por esporte */}
          {last.payload.perSport && Object.keys(last.payload.perSport).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Radio className="h-4 w-4 text-rose-400" />
                  Por esporte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(last.payload.perSport).map(([sp, count]) => (
                    <Stat key={sp} label={sp} value={count} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Erros */}
          {last.payload.errors && last.payload.errors.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Erros ({last.payload.errors_count ?? last.payload.errors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-xs font-mono text-muted-foreground">
                  {last.payload.errors.map((err, i) => (
                    <li key={i} className="break-all">• {err}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Histórico */}
          {history.length > 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Histórico recente</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {history.slice(1).map((row) => {
                    const total = Object.values(row.payload.tv_stats_by_date || {})
                      .reduce((s, v) => s + (v.events_with_br || 0), 0);
                    return (
                      <div key={row.id} className="px-4 py-2 flex items-center justify-between text-xs">
                        <span className="font-mono text-muted-foreground">
                          {format(new Date(row.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                        <span>
                          {row.payload.upserted ?? 0} upserted · {total} eventos BR
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, highlight, danger }: { label: string; value: number | string; highlight?: boolean; danger?: boolean }) {
  return (
    <div className="rounded-md border border-border/50 bg-card/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`font-bold text-base ${danger ? "text-destructive" : highlight ? "text-primary" : ""}`}>
        {value}
      </div>
    </div>
  );
}
