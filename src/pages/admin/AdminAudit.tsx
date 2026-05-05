import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollText, Trash2, Pause, Play, ShieldAlert, RefreshCw, Radio, AlertTriangle } from "lucide-react";
import { useState } from "react";

type AuditRow = {
  id: string;
  action: string;
  entity: string;
  actor_id: string | null;
  payload: any;
  created_at: string;
};

const ACTION_META: Record<string, { label: string; icon: any; cls: string }> = {
  delete_api: { label: "Jogo da API removido", icon: Trash2, cls: "text-rose-300 bg-rose-500/10 border-rose-500/30" },
  delete_manual: { label: "Jogo manual removido", icon: Trash2, cls: "text-amber-300 bg-amber-500/10 border-amber-500/30" },
  api_sync_paused: { label: "Sincronização pausada (filtro MANUAL_ONLY ativo)", icon: Pause, cls: "text-amber-300 bg-amber-500/10 border-amber-500/30" },
  api_sync_resumed: { label: "Sincronização reativada", icon: Play, cls: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" },
  api_sync_run: { label: "Sync da API executado", icon: RefreshCw, cls: "text-sky-300 bg-sky-500/10 border-sky-500/30" },
  api_live_update_run: { label: "Atualização AO VIVO executada", icon: Radio, cls: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" },
  api_sync_failed: { label: "Falha no sync da API", icon: AlertTriangle, cls: "text-rose-300 bg-rose-500/10 border-rose-500/30" },
};

const FILTERS = [
  { value: "all", label: "Tudo" },
  { value: "api_sync_run", label: "Execuções sync" },
  { value: "api_live_update_run", label: "Updates ao vivo" },
  { value: "delete_api", label: "Removidos da API" },
  { value: "delete_manual", label: "Removidos manuais" },
  { value: "api_sync_paused", label: "Pausas" },
  { value: "api_sync_resumed", label: "Reativações" },
  { value: "api_sync_failed", label: "Falhas" },
] as const;

const AdminAudit = () => {
  const [filter, setFilter] = useState<typeof FILTERS[number]["value"]>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["audit_logs", filter],
    queryFn: async () => {
      let q = supabase.from("audit_logs" as any).select("*").order("created_at", { ascending: false }).limit(200);
      if (filter !== "all") q = q.eq("action", filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as AuditRow[];
    },
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="glass-panel rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-400" />
          <h3 className="text-sm font-bold text-foreground">Trilha de auditoria</h3>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Registra automaticamente quando jogos são removidos (manual ou API) e quando o filtro MANUAL_ONLY é ativado/desativado pela pausa/reativação da sincronização. Apenas administradores podem ler.
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition ${
                filter === f.value
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-white/[0.04] border-white/10 text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">Eventos recentes</h3>
          </div>
          <span className="text-[10px] text-muted-foreground">{data?.length || 0} de 200</span>
        </div>
        <div className="divide-y divide-white/[0.04] max-h-[600px] overflow-y-auto">
          {isLoading && <p className="p-6 text-center text-xs text-muted-foreground">Carregando…</p>}
          {!isLoading && !data?.length && (
            <p className="p-6 text-center text-xs text-muted-foreground">Nenhum registro ainda.</p>
          )}
          {(data || []).map((row) => {
            const meta = ACTION_META[row.action] || { label: row.action, icon: ScrollText, cls: "text-muted-foreground bg-white/5 border-white/10" };
            const Icon = meta.icon;
            const ts = new Date(row.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
            const p = row.payload || {};
            return (
              <div key={row.id} className="p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border ${meta.cls}`}>
                    <Icon className="h-3 w-3" />
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{ts}</span>
                </div>
                {row.entity === "daily_games" && (
                  <p className="text-xs text-foreground truncate">
                    {p.home_team} {p.away_team && p.away_team !== "—" && `× ${p.away_team}`}
                    <span className="text-muted-foreground">
                      {" "}• {p.date} {p.game_time?.slice(0, 5)} • {p.sport_type} • src: {p.source}
                    </span>
                  </p>
                )}
                {row.entity === "settings" && (
                  <p className="text-[11px] text-muted-foreground">
                    {p.previous ? `de "${p.previous}" → "${p.new}"` : `→ "${p.new}"`} • {p.jobs_updated} cron job(s) atualizado(s)
                  </p>
                )}
                <p className="text-[9px] text-muted-foreground/60 font-mono truncate">
                  actor: {row.actor_id?.slice(0, 8) || "—"} {row.payload?.external_id ? `• ext: ${row.payload.external_id}` : ""}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminAudit;
