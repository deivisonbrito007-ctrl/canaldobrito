import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Radio, Download, EyeOff, Info, AlertTriangle, CheckCircle2, Link2, Settings2, Activity, PlugZap, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { getLocalDateString, SPORT_EMOJI, SPORT_LABEL, type SportType } from "@/lib/gameUtils";
import { useSettings } from "@/hooks/useSettings";
import { useChannelMappings } from "@/hooks/useChannelMappings";
import { resolveChannel } from "@/lib/channelResolver";
import { ChannelMiniLogo } from "@/components/public/ChannelBadge";
import { ChannelBadgeList } from "@/components/public/ChannelBadge";
import { UnknownChannelActions } from "@/components/admin/UnknownChannelActions";
import { AdminEmptyState } from "@/components/admin/AdminStates";
import {
  useSportsApiFetch,
  useSportsApiIgnore,
  useSportsApiImport,
  useSportsApiLive,
  useSportsApiRuns,
  useSportsApiSuggestions,
  useSportsApiUpdateExisting,
  useSportsApiStatus,
  useSportsApiTest,
  useSportsApiAutoFetch,
} from "@/hooks/useSportsApi";
import {
  SUGGESTION_STATUS_LABEL,
  WARNING_LABEL,
  formatScore,
  formatLiveClock,
  type SportsApiSuggestion,
  type SuggestionStatus,
} from "@/lib/sportsApi";

type StatusTab = "todos" | "prontos" | "revisar" | "aovivo" | "duplicados" | "sem_transmissao" | "estrangeiro";

const TAB_LABEL: Record<StatusTab, string> = {
  todos: "Relevantes",
  prontos: "Prontos",
  revisar: "Revisar",
  aovivo: "Ao vivo",
  duplicados: "Duplicados",
  sem_transmissao: "Sem transmissão",
  estrangeiro: "Canal estrangeiro",
};

const isDiscarded = (s: SportsApiSuggestion) => s.status === "ignorado_sem_transmissao" || s.status === "ignorado_canal_estrangeiro";

const matchesTab = (s: SportsApiSuggestion, tab: StatusTab) => {
  if (tab === "sem_transmissao") return s.status === "ignorado_sem_transmissao";
  if (tab === "estrangeiro") return s.status === "ignorado_canal_estrangeiro";
  if (tab === "aovivo") return s.api_status === "live" && !isDiscarded(s);
  if (tab === "todos") return s.review_status !== "ignored" && !isDiscarded(s);
  if (s.review_status === "ignored") return false;
  if (tab === "prontos") return s.status === "pronto_para_importar" && s.review_status === "pending";
  if (tab === "revisar") return s.status === "revisar" || s.status === "conflito" || s.status === "erro";
  if (tab === "duplicados") return s.status === "duplicado" || s.review_status === "imported";
  return true;
};

/** Motivo do aceite/descarte, em uma frase. */
const reasonOf = (s: SportsApiSuggestion): string => {
  if (s.review_status === "imported") return "Importado para a programação.";
  if (s.review_status === "ignored") return "Ignorado manualmente pelo admin.";
  const w = (code: string) => s.warnings.find((x) => x.code === code);
  switch (s.status) {
    case "ignorado_sem_transmissao": return "A API não informou nenhum canal de transmissão.";
    case "ignorado_canal_estrangeiro": return w("canal_estrangeiro")?.message ?? "Só transmissão fora do Brasil.";
    case "pronto_para_importar":
      return s.broadcast_country
        ? `Transmissão para o Brasil (${s.broadcast_country.toUpperCase()}) em canal cadastrado.`
        : "Canal cadastrado no app (país não informado pela API).";
    case "revisar":
      return s.normalized_channels.length === 0
        ? "Canal não reconhecido no cadastro — associe ou cadastre antes de importar."
        : "Tem canal aceito, mas também canal desconhecido para conferir.";
    case "duplicado": return "Já existe na programação com o mesmo confronto e horário.";
    case "conflito": return "Já existe na programação, mas horário/competição divergem.";
    case "erro": return w("dados_incompletos")?.message ?? "Dados incompletos vindos da API.";
  }
  return "";
};

const STATUS_STYLE: Record<SuggestionStatus, string> = {
  pronto_para_importar: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  revisar: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  ignorado_sem_transmissao: "bg-white/[0.05] text-white/45 border-white/10",
  ignorado_canal_estrangeiro: "bg-white/[0.05] text-white/45 border-white/10",
  duplicado: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  conflito: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  erro: "bg-red-500/15 text-red-300 border-red-500/30",
};

export const SportsApiPanel = () => {
  const [date, setDate] = useState(getLocalDateString());
  const [tab, setTab] = useState<StatusTab>("todos");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [openDetails, setOpenDetails] = useState<string | null>(null);
  const [showTech, setShowTech] = useState(false);

  const { data: settings } = useSettings();
  const enabled = (settings?.sportsapi_enabled ?? "true") !== "false";
  const { data: suggestions = [], isLoading } = useSportsApiSuggestions(date);
  const { data: runs = [] } = useSportsApiRuns(3);
  const fetchM = useSportsApiFetch();
  const liveM = useSportsApiLive();
  const importM = useSportsApiImport();
  const ignoreM = useSportsApiIgnore();
  const updateM = useSportsApiUpdateExisting();
  const statusQ = useSportsApiStatus();
  const testM = useSportsApiTest();
  const autoM = useSportsApiAutoFetch();

  const summary = useMemo(() => {
    const s = { total: 0, brasil: 0, cadastrado: 0, prontos: 0, revisar: 0, semTransmissao: 0, estrangeiro: 0, duplicados: 0, importados: 0 };
    for (const x of suggestions) {
      s.total++;
      if (x.status === "ignorado_sem_transmissao") { s.semTransmissao++; continue; }
      if (x.status === "ignorado_canal_estrangeiro") { s.estrangeiro++; continue; }
      if (x.broadcast_country) s.brasil++;
      else if (x.normalized_channels.length) s.cadastrado++;
      if (x.review_status === "imported") s.importados++;
      else if (x.status === "duplicado") s.duplicados++;
      else if (x.status === "pronto_para_importar" && x.review_status === "pending") s.prontos++;
      else if (["revisar", "conflito", "erro"].includes(x.status)) s.revisar++;
    }
    return s;
  }, [suggestions]);

  const sportsPresent = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of suggestions) m.set(s.sport_type, (m.get(s.sport_type) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [suggestions]);

  const channelsPresent = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of suggestions) for (const c of s.normalized_channels) m.set(c, (m.get(c) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [suggestions]);

  const passesFilters = (s: SportsApiSuggestion) =>
    (sportFilter === "all" || s.sport_type === sportFilter) && (channelFilter === "all" || s.normalized_channels.includes(channelFilter));
  const visible = useMemo(
    () => suggestions.filter((s) => matchesTab(s, tab) && passesFilters(s)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [suggestions, tab, sportFilter, channelFilter],
  );
  const readyIds = visible.filter((s) => s.status === "pronto_para_importar" && s.review_status === "pending").map((s) => s.id);

  const run = async <T,>(p: Promise<T>, ok: (r: T) => string) => {
    try {
      const r = await p;
      toast.success(ok(r));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro na SportsAPI");
    }
  };

  const lastRun = runs.find((r) => (r.kind === "fetch" || r.kind === "fetch-auto") && r.date === date);
  const st = statusQ.data;
  const fmtTs = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—");

  return (
    <div className="space-y-4">
      {!enabled && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          A integração está desativada. Ative em Configurações → SportsAPI.
        </div>
      )}

      {/* Controles */}
      <div className="glass-panel rounded-2xl border border-white/[0.06] p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            Data
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 w-[160px] text-sm" aria-label="Data das sugestões" />
          </label>
          <Button
            className="min-h-11 gap-1.5"
            disabled={!enabled || fetchM.isPending}
            onClick={() =>
              run(fetchM.mutateAsync({ date }), (r) => {
                if (r.errors.length) toast.warning(`Parcial: ${r.errors.join(" · ")}`);
                return r.totals.found === 0
                  ? "Nenhum jogo com transmissão encontrado pela SportsAPI para esta data."
                  : `${r.totals.found} encontrados · ${r.totals.ready} prontos · ${r.totals.review} para revisar`;
              })
            }
          >
            {fetchM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Buscar jogos com transmissão
          </Button>
          <Button
            variant="outline"
            className="min-h-11 gap-1.5"
            disabled={!enabled || liveM.isPending}
            onClick={() => run(liveM.mutateAsync(), (r) => (r.skipped ? "Atualização ao vivo desativada." : `${r.updated} jogo(s) atualizados de ${r.checked ?? 0} verificados.`))}
          >
            {liveM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4 text-red-400" />}
            Buscar ao vivo agora
          </Button>
          <Link to="/admin/configuracoes#sportsapi" className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground min-h-11 px-1">
            <Settings2 className="h-3.5 w-3.5" /> Configurações
          </Link>
        </div>
        {lastRun && (
          <p className="text-[10px] text-muted-foreground">
            Última busca: {new Date(lastRun.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · esportes: {lastRun.sports.join(", ")}
            {lastRun.error_message ? ` · ${lastRun.error_message}` : ""}
          </p>
        )}

        {/* Resumo */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5" role="status" aria-live="polite">
          {[
            ["Lidos", summary.total, "text-foreground"],
            ["Transmissão BR", summary.brasil, "text-emerald-300"],
            ["Canal cadastrado", summary.cadastrado, "text-emerald-200"],
            ["Prontos", summary.prontos, "text-primary"],
            ["Para revisar", summary.revisar, "text-amber-300"],
            ["Sem transmissão", summary.semTransmissao, "text-white/50"],
            ["Canal estrangeiro", summary.estrangeiro, "text-white/50"],
            ["Duplicados", summary.duplicados, "text-sky-300"],
            ["Importados", summary.importados, "text-primary"],
          ].map(([label, value, cls]) => (
            <div key={label as string} className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-2 py-1.5">
              <p className={`text-base font-bold tabular-nums leading-none ${cls}`}>{value}</p>
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground mt-1 truncate">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Painel técnico */}
      <div className="glass-panel rounded-2xl border border-white/[0.06] p-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowTech((v) => !v)} aria-expanded={showTech} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground min-h-10 px-1">
            <Activity className="h-3.5 w-3.5 text-emerald-400" /> Automação e cota
            {st?.quota.nearBudget && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-200 border border-amber-500/30">perto do limite</span>}
            {st?.schedule.pausedNow && <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/60 border border-white/10">pausa noturna</span>}
          </button>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {st ? `Hoje ${st.quota.day}/${st.quota.dailyBudget} req · mês ${st.quota.month.toLocaleString("pt-BR")}/${st.quota.monthlyLimit.toLocaleString("pt-BR")}` : statusQ.isError ? "Status indisponível" : "Carregando status…"}
          </span>
          <div className="ml-auto flex gap-1.5">
            <Button size="sm" variant="ghost" className="min-h-10 gap-1 text-[11px]" disabled={testM.isPending}
              onClick={() => run(testM.mutateAsync(), (r) => (r.ok ? `Conexão OK · ${r.latencyMs} ms · ${r.sports ?? "?"} esportes` : `Falha: ${r.message}`))}>
              {testM.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />} Testar conexão
            </Button>
            <Button size="sm" variant="ghost" className="min-h-10 gap-1 text-[11px]" disabled={!enabled || autoM.isPending}
              onClick={() => run(autoM.mutateAsync(), (r) => (r.skipped ? `Busca automática não rodou (${r.reason}).` : "Busca automática executada para hoje e amanhã."))}>
              {autoM.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock3 className="h-3.5 w-3.5" />} Buscar agora (hoje+amanhã)
            </Button>
          </div>
        </div>
        {showTech && st && (
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-[11px]">
            <Row k="Última busca manual" v={fmtTs(st.lastFetch?.created_at)} />
            <Row k="Última busca automática" v={fmtTs(st.lastAuto?.created_at)} />
            <Row k="Última atualização ao vivo" v={`${fmtTs(st.lastLive?.created_at)}${st.lastLive?.total_updated != null ? ` · ${st.lastLive.total_updated} atualizado(s)` : ""}`} />
            <Row k="Próxima busca automática" v={!st.schedule.autoFetch ? "desligada" : st.schedule.nextAuto && st.schedule.nextAuto.includes("T") ? fmtTs(st.schedule.nextAuto) : st.schedule.nextAuto ?? "—"} />
            <Row k="Placar ao vivo" v={st.schedule.live ? `a cada ${st.schedule.liveIntervalLiveSec}s com jogo ao vivo · ${st.schedule.liveIntervalIdleMin} min sem` : "desligado"} />
            <Row k="Modo" v={st.mode === "auto" ? "Auto-importar" : st.mode === "manual" ? "Manual" : "Sugestões"} />
            <Row k="Chave no servidor" v={st.hasKey ? "configurada" : "ausente"} />
            <Row k="Último erro/parcial" v={st.lastPartial ? `${fmtTs(st.lastPartial.created_at)} · ${st.lastPartial.error_message ?? ""}` : "nenhum"} />
          </dl>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar sugestões por status">
        {(Object.keys(TAB_LABEL) as StatusTab[]).map((t) => {
          const count = suggestions.filter((s) => matchesTab(s, t) && passesFilters(s)).length;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`min-h-11 px-3 rounded-full text-[11px] font-semibold border transition ${
                tab === t ? "bg-primary/15 border-primary/40 text-primary" : "bg-white/[0.03] border-white/[0.08] text-muted-foreground hover:text-foreground"
              }`}
            >
              {TAB_LABEL[t]} <span className="opacity-60 tabular-nums">· {count}</span>
            </button>
          );
        })}
      </div>
      {sportsPresent.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1" role="toolbar" aria-label="Filtrar por esporte">
          <button onClick={() => setSportFilter("all")} aria-pressed={sportFilter === "all"} className={`shrink-0 min-h-11 px-3 rounded-full text-[11px] border ${sportFilter === "all" ? "bg-primary/15 border-primary/40 text-primary" : "border-white/[0.08] text-muted-foreground"}`}>
            Todos
          </button>
          {sportsPresent.map(([st, n]) => (
            <button key={st} onClick={() => setSportFilter(sportFilter === st ? "all" : st)} aria-pressed={sportFilter === st} className={`shrink-0 min-h-11 px-3 rounded-full text-[11px] border whitespace-nowrap ${sportFilter === st ? "bg-primary/15 border-primary/40 text-primary" : "border-white/[0.08] text-muted-foreground"}`}>
              {SPORT_EMOJI[st as SportType] ?? "🏆"} {SPORT_LABEL[st as SportType] ?? st} · {n}
            </button>
          ))}
        </div>
      )}

      {channelsPresent.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1" role="toolbar" aria-label="Filtrar por canal">
          <button onClick={() => setChannelFilter("all")} aria-pressed={channelFilter === "all"} className={`shrink-0 min-h-10 px-3 rounded-full text-[11px] border ${channelFilter === "all" ? "bg-primary/15 border-primary/40 text-primary" : "border-white/[0.08] text-muted-foreground"}`}>
            Todos os canais
          </button>
          {channelsPresent.map(([c, n]) => (
            <button key={c} onClick={() => setChannelFilter(channelFilter === c ? "all" : c)} aria-pressed={channelFilter === c} className={`shrink-0 min-h-10 pl-1.5 pr-3 rounded-full text-[11px] border inline-flex items-center gap-1.5 whitespace-nowrap ${channelFilter === c ? "bg-primary/15 border-primary/40 text-primary" : "border-white/[0.08] text-muted-foreground"}`}>
              <ChannelMiniLogo name={c} /> {c} · {n}
            </button>
          ))}
        </div>
      )}

      {/* Ação em lote */}
      {readyIds.length > 0 && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2">
          <p className="text-[11px] text-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> {readyIds.length} jogo(s) prontos com canal reconhecido.
          </p>
          <Button
            size="sm"
            className="min-h-10 gap-1"
            disabled={importM.isPending}
            onClick={() =>
              run(importM.mutateAsync({ ids: readyIds }), (r) => {
                const ok = r.results.filter((x) => x.ok).length;
                return `${ok} importado(s)${ok < r.results.length ? ` · ${r.results.length - ok} não importados` : ""}`;
              })
            }
          >
            {importM.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Importar prontos
          </Button>
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-white/[0.03] relative overflow-hidden"><div className="absolute inset-0 shimmer" /></div>)}</div>
      ) : suggestions.length === 0 ? (
        <AdminEmptyState
          icon={Info}
          title="Nenhum jogo com transmissão encontrado pela SportsAPI para esta data."
          description="Use “Buscar jogos com transmissão” para consultar a API. Só entram jogos com canal para o Brasil ou canal reconhecido no cadastro."
        />
      ) : visible.length === 0 ? (
        <AdminEmptyState title="Nada nesse filtro" description="Troque o status, o esporte ou o canal para ver outras sugestões." action={<Button variant="outline" size="sm" onClick={() => { setTab("todos"); setSportFilter("all"); setChannelFilter("all"); }}>Limpar filtros</Button>} />
      ) : (
        <ul className="space-y-2" aria-label="Sugestões da SportsAPI">
          {visible.map((s) => (
            <SuggestionRow
              key={s.id}
              s={s}
              open={openDetails === s.id}
              onToggleDetails={() => setOpenDetails(openDetails === s.id ? null : s.id)}
              busy={importM.isPending || ignoreM.isPending || updateM.isPending}
              onImport={() => run(importM.mutateAsync({ ids: [s.id] }), (r) => (r.results[0]?.ok ? "Jogo importado para a programação." : `Não importado: ${r.results[0]?.reason ?? "erro"}`))}
              onIgnore={() => run(ignoreM.mutateAsync([s.id]), () => "Sugestão ignorada.")}
              onUpdate={() => run(updateM.mutateAsync(s.id), () => "Jogo da agenda atualizado com dados da API.")}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="min-w-0">
    <dt className="text-[9px] uppercase tracking-wide text-muted-foreground/70">{k}</dt>
    <dd className="text-foreground/90 truncate" title={v}>{v}</dd>
  </div>
);

const SuggestionRow = ({
  s, open, onToggleDetails, busy, onImport, onIgnore, onUpdate,
}: {
  s: SportsApiSuggestion;
  open: boolean;
  onToggleDetails: () => void;
  busy: boolean;
  onImport: () => void;
  onIgnore: () => void;
  onUpdate: () => void;
}) => {
  const { data: mappings } = useChannelMappings();
  const st = s.sport_type as SportType;
  const single = !s.away_team;
  const score = formatScore(s);
  const clock = formatLiveClock(s);
  const unknown = s.tv_networks
    .map((n) => n.name)
    .filter((name) => resolveChannel(name, mappings).status === "unknown");
  const isIgnored = s.review_status === "ignored";
  const isImported = s.review_status === "imported";
  const canImport = !isIgnored && !isImported && (s.status === "pronto_para_importar" || s.status === "revisar" || s.status === "conflito") && s.normalized_channels.length > 0;
  const canUpdate = !isImported && !!s.matched_game_id && (s.status === "duplicado" || s.status === "conflito");

  return (
    <li className={`glass-panel rounded-xl border border-white/[0.06] p-3 space-y-2 ${isIgnored ? "opacity-55" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-[58px] text-center border-r border-white/[0.06] pr-2">
          <p className="text-xl font-bold tabular-nums leading-none">{s.game_time.slice(0, 5)}</p>
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground mt-1">{s.api_status === "live" ? "ao vivo" : s.api_status === "finished" ? "fim" : "prev."}</p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{SPORT_EMOJI[st] ?? "🏆"} {SPORT_LABEL[st] ?? s.sport}</span>
            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${STATUS_STYLE[s.status]}`}>
              {isImported ? "Importado" : isIgnored ? "Ignorado" : SUGGESTION_STATUS_LABEL[s.status]}
            </span>
            {s.broadcast_country && <span className="text-[9px] px-1.5 py-0.5 rounded border border-white/10 text-white/60">🇧🇷 {s.broadcast_country}</span>}
          </div>
          <p className="font-semibold text-[14px] leading-snug truncate">
            {single ? s.home_team : <>{s.home_team} <span className="text-white/40 text-xs">x</span> {s.away_team}</>}
            {score && <span className="ml-2 tabular-nums text-primary">{score}</span>}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {s.competition || "Competição não informada"}
            {s.competition_country ? ` · ${s.competition_country}` : ""}
            {clock ? ` · ${clock}` : ""}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {s.normalized_channels.length > 0 ? (
              <ChannelBadgeList channels={s.normalized_channels} max={3} size="sm" />
            ) : (
              <span className="text-[10px] uppercase tracking-wide text-white/50 px-2 py-0.5 rounded border border-dashed border-white/15">Sem canal válido</span>
            )}
            <span className="text-[10px] text-muted-foreground/70 truncate">
              API: {s.tv_networks.map((n) => `${n.name}${n.country ? ` (${n.country})` : ""}`).join(", ") || "—"}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground/80 flex items-start gap-1">
            <Info className="h-3 w-3 mt-[1px] shrink-0 opacity-60" aria-hidden />
            <span><span className="font-semibold text-foreground/70">Motivo:</span> {reasonOf(s)}</span>
          </p>
          {s.warnings.length > 0 && !isIgnored && !isDiscarded(s) && (
            <ul className="mt-1.5 flex flex-wrap gap-1" aria-label="Alertas">
              {s.warnings.map((w, i) => (
                <li key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-200 border border-amber-500/20" title={w.message}>
                  {WARNING_LABEL[w.code]}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/[0.05]">
        {canImport && (
          <Button size="sm" className="min-h-10 gap-1 text-[11px]" disabled={busy} onClick={onImport}>
            <Download className="h-3.5 w-3.5" /> Importar
          </Button>
        )}
        {canUpdate && (
          <Button size="sm" variant="outline" className="min-h-10 gap-1 text-[11px]" disabled={busy} onClick={onUpdate}>
            <Link2 className="h-3.5 w-3.5" /> Atualizar dados do jogo
          </Button>
        )}
        {!isIgnored && !isImported && (
          <Button size="sm" variant="ghost" className="min-h-10 gap-1 text-[11px] text-muted-foreground" disabled={busy} onClick={onIgnore}>
            <EyeOff className="h-3.5 w-3.5" /> Ignorar
          </Button>
        )}
        {unknown.slice(0, 2).map((name) => (
          <div key={name} className="flex items-center gap-1 text-[10px] text-amber-200">
            <span className="hidden sm:inline">Associar “{name}”:</span>
            <UnknownChannelActions channelName={name} />
          </div>
        ))}
        <button onClick={onToggleDetails} aria-expanded={open} className="ml-auto min-h-10 px-2 text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <Info className="h-3.5 w-3.5" /> {open ? "Ocultar detalhes" : "Ver detalhes"}
        </button>
      </div>
      {open && (
        <pre className="text-[10px] leading-relaxed bg-black/40 rounded-lg p-2 overflow-x-auto max-h-56 text-white/70">
          {JSON.stringify({ external_id: s.external_id, sport: s.sport, start_time: s.start_time, tv_networks: s.tv_networks, warnings: s.warnings, payload: s.payload }, null, 2)}
        </pre>
      )}
    </li>
  );
};
