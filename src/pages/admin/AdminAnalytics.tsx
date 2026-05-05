import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3, RefreshCw, Trash2, Users, MousePointerClick, CalendarIcon, GitCompareArrows, ArrowUp, ArrowDown, Minus, Send, Target, MousePointer2, TrendingUp } from "lucide-react";
import { readEventsLog, clearEventsLog, type LoggedEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine } from "recharts";

interface CampaignRow {
  campaign: string;
  total: number;
  visitors: number;
  sessions: number;
  byTab: Map<string, number>;
}

interface TabRow {
  tab: string;
  total: number;
  fromShare: number;
  visitors: number;
}

interface Aggregate {
  campaigns: CampaignRow[];
  tabs: TabRow[];
  totals: { events: number; visitors: number; sessions: number };
}

const PRESETS: { label: string; days: number }[] = [
  { label: "24h", days: 1 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function aggregate(events: LoggedEvent[], from: number, to: number): Aggregate {
  const filtered = events.filter((e) => e.ts >= from && e.ts <= to);
  const campaignMap = new Map<string, CampaignRow>();
  const tabMap = new Map<string, TabRow>();
  const allVisitors = new Set<string>();
  const allSessions = new Set<string>();
  const campaignVisitors = new Map<string, Set<string>>();
  const campaignSessions = new Map<string, Set<string>>();
  const tabVisitors = new Map<string, Set<string>>();

  for (const ev of filtered) {
    const userId = String(ev.props.user_id ?? "anon");
    const sessionId = String(ev.props.session_id ?? "?");
    allVisitors.add(userId);
    allSessions.add(sessionId);

    if (ev.event === "landing_with_utm" || ev.event === "tab_view" || ev.event === "content_card_click") {
      const campaign = (ev.props.utm_campaign as string) || "(direct)";
      const row = campaignMap.get(campaign) ?? { campaign, total: 0, visitors: 0, sessions: 0, byTab: new Map() };
      row.total += 1;
      const tab = (ev.props.tab as string) || (ev.props.landing_tab as string) || "—";
      row.byTab.set(tab, (row.byTab.get(tab) ?? 0) + 1);
      campaignMap.set(campaign, row);

      if (!campaignVisitors.has(campaign)) campaignVisitors.set(campaign, new Set());
      if (!campaignSessions.has(campaign)) campaignSessions.set(campaign, new Set());
      campaignVisitors.get(campaign)!.add(userId);
      campaignSessions.get(campaign)!.add(sessionId);
    }

    if (ev.event === "tab_view") {
      const tab = (ev.props.tab as string) || "—";
      const row = tabMap.get(tab) ?? { tab, total: 0, fromShare: 0, visitors: 0 };
      row.total += 1;
      if (ev.props.from_share) row.fromShare += 1;
      tabMap.set(tab, row);
      if (!tabVisitors.has(tab)) tabVisitors.set(tab, new Set());
      tabVisitors.get(tab)!.add(userId);
    }
  }

  for (const [c, row] of campaignMap) {
    row.visitors = campaignVisitors.get(c)?.size ?? 0;
    row.sessions = campaignSessions.get(c)?.size ?? 0;
  }
  for (const [t, row] of tabMap) {
    row.visitors = tabVisitors.get(t)?.size ?? 0;
  }

  return {
    campaigns: Array.from(campaignMap.values()).sort((a, b) => b.total - a.total),
    tabs: Array.from(tabMap.values()).sort((a, b) => b.total - a.total),
    totals: { events: filtered.length, visitors: allVisitors.size, sessions: allSessions.size },
  };
}

function fmtRange(from: Date, to: Date): string {
  return `${format(from, "dd/MM", { locale: ptBR })} – ${format(to, "dd/MM", { locale: ptBR })}`;
}

interface RemoteEvent {
  event: string;
  user_id: string | null;
  session_id: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  tab: string | null;
  surface: string | null;
  props: Record<string, unknown> | null;
  created_at: string;
}

interface FunnelRow {
  campaign: string;
  shares: number;
  landings: number;
  tabViews: number;
  uniqueLanders: number;
  ctr: number;
  conversion: number;
}

function computeFunnel(remote: RemoteEvent[]): FunnelRow[] {
  const map = new Map<string, { shares: number; landings: number; tabViews: number; landers: Set<string> }>();
  const ensure = (c: string) => {
    if (!map.has(c)) map.set(c, { shares: 0, landings: 0, tabViews: 0, landers: new Set() });
    return map.get(c)!;
  };

  for (const ev of remote) {
    const campaign = ev.utm_campaign || (ev.event === "link_share" ? null : "(direct)");
    if (ev.event === "link_share") {
      const tabSlug = (ev.props?.tab_slug as string) || (ev.tab as string) || null;
      const inferred = ev.utm_campaign || (tabSlug ? `share-${tabSlug}` : null);
      if (!inferred) continue;
      ensure(inferred).shares += 1;
    } else if (ev.event === "landing_with_utm" && campaign) {
      const row = ensure(campaign);
      row.landings += 1;
      if (ev.user_id) row.landers.add(ev.user_id);
    } else if (ev.event === "tab_view" && campaign && campaign !== "(direct)") {
      ensure(campaign).tabViews += 1;
    }
  }

  const rows: FunnelRow[] = [];
  for (const [campaign, v] of map) {
    const uniqueLanders = v.landers.size;
    rows.push({
      campaign,
      shares: v.shares,
      landings: v.landings,
      tabViews: v.tabViews,
      uniqueLanders,
      ctr: v.shares > 0 ? (uniqueLanders > 0 ? uniqueLanders : v.landings) / v.shares : 0,
      conversion: v.landings > 0 ? v.tabViews / v.landings : 0,
    });
  }
  return rows.sort((a, b) => b.shares + b.landings - (a.shares + a.landings));
}

interface DailyPoint {
  day: string;
  label: string;
  shares: number;
  landings: number;
  uniqueLanders: number;
  tabViews: number;
  ctr: number | null;
  conversion: number | null;
}

// Format a Date as YYYY-MM-DD in America/Sao_Paulo (UTC-3, no DST)
function spDayKey(d: Date): string {
  const sp = new Date(d.getTime() - 3 * 3600 * 1000);
  return sp.toISOString().slice(0, 10);
}

function computeDaily(
  remote: RemoteEvent[],
  from: Date,
  to: Date,
  campaign: string | null,
): DailyPoint[] {
  const buckets = new Map<string, { shares: number; landings: number; tabViews: number; landers: Set<string> }>();
  const ensure = (k: string) => {
    if (!buckets.has(k)) buckets.set(k, { shares: 0, landings: 0, tabViews: 0, landers: new Set() });
    return buckets.get(k)!;
  };

  // Pre-fill all days in window so the chart shows continuous x-axis
  const startKey = spDayKey(from);
  const endKey = spDayKey(to);
  const cursor = new Date(from);
  cursor.setHours(12, 0, 0, 0);
  let safety = 0;
  while (safety++ < 400) {
    const k = spDayKey(cursor);
    ensure(k);
    if (k >= endKey) break;
    cursor.setDate(cursor.getDate() + 1);
  }
  ensure(startKey);

  for (const ev of remote) {
    const created = new Date(ev.created_at);
    const key = spDayKey(created);
    const bucket = ensure(key);
    if (ev.event === "link_share") {
      const tabSlug = (ev.props?.tab_slug as string) || (ev.tab as string) || null;
      const inferred = ev.utm_campaign || (tabSlug ? `share-${tabSlug}` : null);
      if (!inferred) continue;
      if (campaign && inferred !== campaign) continue;
      bucket.shares += 1;
    } else if (ev.event === "landing_with_utm") {
      if (campaign && ev.utm_campaign !== campaign) continue;
      bucket.landings += 1;
      if (ev.user_id) bucket.landers.add(ev.user_id);
    } else if (ev.event === "tab_view" && ev.utm_campaign) {
      if (campaign && ev.utm_campaign !== campaign) continue;
      bucket.tabViews += 1;
    }
  }

  return Array.from(buckets.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([day, v]) => {
      const [y, m, d] = day.split("-");
      return {
        day,
        label: `${d}/${m}`,
        shares: v.shares,
        landings: v.landings,
        uniqueLanders: v.landers.size,
        tabViews: v.tabViews,
        ctr: v.shares > 0 ? ((v.landers.size > 0 ? v.landers.size : v.landings) / v.shares) * 100 : null,
        conversion: v.landings > 0 ? (v.tabViews / v.landings) * 100 : null,
      };
    });
}

interface TabFunnelRow {
  tab: string;
  shares: number;
  landings: number;
  uniqueLanders: number;
  tabViews: number;
  ctr: number;
  conversion: number;
}

function computeFunnelByTab(remote: RemoteEvent[]): TabFunnelRow[] {
  const map = new Map<string, { shares: number; landings: number; tabViews: number; landers: Set<string> }>();
  const ensure = (t: string) => {
    if (!map.has(t)) map.set(t, { shares: 0, landings: 0, tabViews: 0, landers: new Set() });
    return map.get(t)!;
  };
  for (const ev of remote) {
    if (ev.event === "link_share") {
      const tab = (ev.props?.tab_slug as string) || ev.tab || (ev.props?.tab as string) || null;
      if (!tab) continue;
      ensure(tab).shares += 1;
    } else if (ev.event === "landing_with_utm") {
      const tab = (ev.props?.tab_slug as string) || (ev.props?.landing_tab as string) || ev.tab || null;
      if (!tab) continue;
      const row = ensure(tab);
      row.landings += 1;
      if (ev.user_id) row.landers.add(ev.user_id);
    } else if (ev.event === "tab_view") {
      const tab = ev.tab || (ev.props?.tab as string) || null;
      if (!tab) continue;
      ensure(tab).tabViews += 1;
    }
  }
  const rows: TabFunnelRow[] = [];
  for (const [tab, v] of map) {
    rows.push({
      tab,
      shares: v.shares,
      landings: v.landings,
      uniqueLanders: v.landers.size,
      tabViews: v.tabViews,
      ctr: v.shares > 0 ? ((v.landers.size > 0 ? v.landers.size : v.landings) / v.shares) * 100 : 0,
      conversion: v.landings > 0 ? (v.tabViews / v.landings) * 100 : 0,
    });
  }
  return rows.sort((a, b) => b.shares + b.landings - (a.shares + a.landings));
}


export default function AdminAnalytics() {
  const [events, setEvents] = useState<LoggedEvent[]>([]);
  const [remote, setRemote] = useState<RemoteEvent[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(false);

  const refresh = () => setEvents(readEventsLog());
  useEffect(() => { refresh(); }, []);

  // Primary period (default: last 7 days)
  const [fromA, setFromA] = useState<Date>(() => startOfDay(new Date(Date.now() - 6 * 86400000)));
  const [toA, setToA] = useState<Date>(() => endOfDay(new Date()));

  // Comparison toggle + period (default: previous 7 days)
  const [compareOn, setCompareOn] = useState(false);
  const [fromB, setFromB] = useState<Date>(() => startOfDay(new Date(Date.now() - 13 * 86400000)));
  const [toB, setToB] = useState<Date>(() => endOfDay(new Date(Date.now() - 7 * 86400000)));

  const applyPreset = (days: number) => {
    const to = endOfDay(new Date());
    const from = startOfDay(new Date(Date.now() - (days - 1) * 86400000));
    setFromA(from);
    setToA(to);
    if (compareOn) {
      setToB(endOfDay(new Date(from.getTime() - 86400000)));
      setFromB(startOfDay(new Date(from.getTime() - days * 86400000)));
    }
  };

  // Fetch remote events for the union of both periods
  useEffect(() => {
    let cancelled = false;
    const lo = compareOn ? Math.min(fromA.getTime(), fromB.getTime()) : fromA.getTime();
    const hi = compareOn ? Math.max(toA.getTime(), toB.getTime()) : toA.getTime();
    setLoadingRemote(true);
    (async () => {
      try {
        const { data, error } = await (supabase as unknown as {
          from: (t: string) => {
            select: (s: string) => {
              gte: (c: string, v: string) => {
                lte: (c: string, v: string) => {
                  order: (c: string, o: { ascending: boolean }) => {
                    limit: (n: number) => Promise<{ data: RemoteEvent[] | null; error: unknown }>;
                  };
                };
              };
            };
          };
        })
          .from("analytics_events")
          .select("event,user_id,session_id,utm_campaign,utm_content,tab,surface,props,created_at")
          .gte("created_at", new Date(lo).toISOString())
          .lte("created_at", new Date(hi).toISOString())
          .order("created_at", { ascending: false })
          .limit(5000);
        if (!cancelled && !error && data) setRemote(data);
      } finally {
        if (!cancelled) setLoadingRemote(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fromA, toA, fromB, toB, compareOn]);

  const inWindow = (ts: number, from: Date, to: Date) => ts >= from.getTime() && ts <= to.getTime();
  const remoteA = useMemo(
    () => remote.filter((e) => inWindow(new Date(e.created_at).getTime(), fromA, toA)),
    [remote, fromA, toA]
  );
  const remoteB = useMemo(
    () => (compareOn ? remote.filter((e) => inWindow(new Date(e.created_at).getTime(), fromB, toB)) : []),
    [remote, fromB, toB, compareOn]
  );

  const funnelA = useMemo(() => computeFunnel(remoteA), [remoteA]);
  const funnelB = useMemo(() => computeFunnel(remoteB), [remoteB]);

  const [selectedCampaign, setSelectedCampaign] = useState<string>("__all__");
  const campaignOptions = useMemo(() => {
    const set = new Set<string>();
    funnelA.forEach((r) => set.add(r.campaign));
    funnelB.forEach((r) => set.add(r.campaign));
    return Array.from(set).sort();
  }, [funnelA, funnelB]);
  const dailyCampaign = selectedCampaign === "__all__" ? null : selectedCampaign;
  const dailyA = useMemo(
    () => computeDaily(remoteA, fromA, toA, dailyCampaign),
    [remoteA, fromA, toA, dailyCampaign],
  );
  const dailyB = useMemo(
    () => (compareOn ? computeDaily(remoteB, fromB, toB, dailyCampaign) : []),
    [remoteB, fromB, toB, compareOn, dailyCampaign],
  );
  const dailyChart = useMemo(() => {
    return dailyA.map((p, i) => ({
      label: p.label,
      ctrA: p.ctr,
      convA: p.conversion,
      ctrB: dailyB[i]?.ctr ?? null,
      convB: dailyB[i]?.conversion ?? null,
      sharesA: p.shares,
      landingsA: p.landings,
      tabViewsA: p.tabViews,
      sharesB: dailyB[i]?.shares ?? 0,
    }));
  }, [dailyA, dailyB]);
  const shareDays = useMemo(
    () => dailyA.filter((p) => p.shares > 0).map((p) => p.label),
    [dailyA],
  );
  const tabFunnelA = useMemo(() => computeFunnelByTab(remoteA), [remoteA]);
  const tabFunnelB = useMemo(() => computeFunnelByTab(remoteB), [remoteB]);

  const aggA = useMemo(() => aggregate(events, fromA.getTime(), toA.getTime()), [events, fromA, toA]);
  const aggB = useMemo(
    () => (compareOn ? aggregate(events, fromB.getTime(), toB.getTime()) : null),
    [events, fromB, toB, compareOn]
  );

  const handleClear = () => {
    if (!confirm("Apagar todos os eventos locais? Isso não pode ser desfeito.")) return;
    clearEventsLog();
    refresh();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Analytics UTM
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-body">
            Filtro por data e comparação entre períodos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Limpar
          </Button>
        </div>
      </header>

      {/* Filters */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mr-1">Atalhos:</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.days)}
              className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-surface border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors min-h-[36px]"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PeriodPicker label="Período A" from={fromA} to={toA} setFrom={setFromA} setTo={setToA} accent="primary" />
          <div className={cn("transition-opacity", !compareOn && "opacity-40 pointer-events-none")}>
            <PeriodPicker label="Período B (comparação)" from={fromB} to={toB} setFrom={setFromB} setTo={setToB} accent="muted" />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1 border-t border-border/40">
          <GitCompareArrows className="h-4 w-4 text-muted-foreground" />
          <label htmlFor="cmp" className="text-xs font-body text-foreground cursor-pointer flex-1">
            Comparar dois períodos
          </label>
          <Switch id="cmp" checked={compareOn} onCheckedChange={setCompareOn} />
        </div>
      </Card>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={MousePointerClick} label="Eventos" value={aggA.totals.events} compare={aggB?.totals.events} />
        <StatCard icon={Users} label="Visitantes únicos" value={aggA.totals.visitors} compare={aggB?.totals.visitors} />
        <StatCard icon={Users} label="Sessões" value={aggA.totals.sessions} compare={aggB?.totals.sessions} />
      </div>

      {/* Funil WhatsApp: shares → landings → tab_views (CTR & conversão) */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-xl tracking-wide text-foreground">
            Funil <span className="text-primary">WhatsApp</span>
          </h2>
          {loadingRemote && <span className="text-[10px] text-muted-foreground font-body">carregando…</span>}
        </div>
        <p className="text-[10px] text-muted-foreground font-body">
          CTR = landings únicos ÷ shares · Conversão = tab_views ÷ landings
        </p>
        {funnelA.length === 0 ? (
          <p className="text-xs text-muted-foreground italic font-body">
            Sem shares/landings registrados ainda. Compartilhe um link rápido em /admin/whatsapp para começar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-body">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Campaign</th>
                  <th className="py-2 px-3 text-right"><Send className="inline h-3 w-3" /> Shares</th>
                  <th className="py-2 px-3 text-right"><MousePointer2 className="inline h-3 w-3" /> Landings</th>
                  <th className="py-2 px-3 text-right">CTR</th>
                  <th className="py-2 px-3 text-right">Tab views</th>
                  <th className="py-2 pl-3 text-right"><Target className="inline h-3 w-3" /> Conv.</th>
                </tr>
              </thead>
              <tbody>
                {funnelA.map((r) => {
                  const b = funnelB.find((x) => x.campaign === r.campaign);
                  return (
                    <tr key={r.campaign} className="border-b border-border/30">
                      <td className="py-2 pr-3 font-mono text-[11px] text-foreground">{r.campaign}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{r.shares}{compareOn && <Delta a={r.shares} b={b?.shares ?? 0} />}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{r.landings}{compareOn && <Delta a={r.landings} b={b?.landings ?? 0} />}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-primary font-bold">
                        {(r.ctr * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">{r.tabViews}</td>
                      <td className="py-2 pl-3 text-right tabular-nums text-primary font-bold">
                        {(r.conversion * 100).toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Daily CTR & Conversion trend chart */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl tracking-wide text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Tendência diária
          </h2>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="bg-surface border border-border rounded-md text-xs font-body text-foreground px-3 py-2 min-h-[40px] focus:outline-none focus:border-primary/50"
          >
            <option value="__all__">Todas as campanhas</option>
            {campaignOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <p className="text-[10px] text-muted-foreground font-body">
          CTR (landings ÷ shares) e Conversão (tab_views ÷ landings) por dia. Linhas verticais marcam dias em que houve compartilhamento.
        </p>
        {dailyChart.every((p) => p.ctrA === null && p.convA === null) ? (
          <p className="text-xs text-muted-foreground italic font-body py-8 text-center">
            Sem dados suficientes na janela. Compartilhe um link e aguarde landings.
          </p>
        ) : (
          <div className="h-56 w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChart} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} tickMargin={6} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax / 25) * 25)]}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  formatter={(value: number | null, name: string) => [
                    value === null ? "—" : `${value.toFixed(1)}%`,
                    name,
                  ]}
                  labelFormatter={(label, payload) => {
                    const p = payload?.[0]?.payload as typeof dailyChart[number] | undefined;
                    if (!p) return label;
                    return `${label} · ${p.sharesA} shares · ${p.landingsA} landings · ${p.tabViewsA} views`;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} iconType="line" />
                {shareDays.map((day) => (
                  <ReferenceLine
                    key={day}
                    x={day}
                    stroke="hsl(var(--primary))"
                    strokeDasharray="2 4"
                    strokeOpacity={0.4}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="ctrA"
                  name="CTR"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  connectNulls
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="convA"
                  name="Conversão"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  connectNulls
                  isAnimationActive={false}
                />
                {compareOn && (
                  <Line
                    type="monotone"
                    dataKey="ctrB"
                    name="CTR (B)"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                )}
                {compareOn && (
                  <Line
                    type="monotone"
                    dataKey="convB"
                    name="Conversão (B)"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Campaigns */}

      <Card className="p-4 space-y-3">
        <h2 className="font-display text-xl tracking-wide text-foreground">
          Por <span className="text-primary">utm_campaign</span>
          {compareOn && (
            <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground font-body">
              {fmtRange(fromA, toA)} vs {fmtRange(fromB, toB)}
            </span>
          )}
        </h2>
        {aggA.campaigns.length === 0 ? (
          <p className="text-xs text-muted-foreground italic font-body">Sem dados na janela selecionada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-body">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Campaign</th>
                  <th className="py-2 px-3 text-right">Eventos {compareOn && "(A / B)"}</th>
                  <th className="py-2 px-3 text-right">Visitantes</th>
                  <th className="py-2 px-3 text-right">Sessões</th>
                  <th className="py-2 pl-3">Top abas</th>
                </tr>
              </thead>
              <tbody>
                {aggA.campaigns.map((c) => {
                  const b = aggB?.campaigns.find((x) => x.campaign === c.campaign);
                  return (
                    <tr key={c.campaign} className="border-b border-border/30">
                      <td className="py-2 pr-3 font-mono text-[11px] text-foreground">{c.campaign}</td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        <span className="text-primary font-bold">{c.total}</span>
                        {compareOn && (
                          <>
                            <span className="text-muted-foreground"> / {b?.total ?? 0}</span>
                            <Delta a={c.total} b={b?.total ?? 0} />
                          </>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">{c.visitors}{compareOn && <Delta a={c.visitors} b={b?.visitors ?? 0} />}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{c.sessions}{compareOn && <Delta a={c.sessions} b={b?.sessions ?? 0} />}</td>
                      <td className="py-2 pl-3 text-muted-foreground">
                        {Array.from(c.byTab.entries())
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 3)
                          .map(([t, n]) => `${t} (${n})`)
                          .join(", ")}
                      </td>
                    </tr>
                  );
                })}
                {compareOn &&
                  aggB?.campaigns
                    .filter((b) => !aggA.campaigns.find((a) => a.campaign === b.campaign))
                    .map((b) => (
                      <tr key={`b-${b.campaign}`} className="border-b border-border/30 opacity-60">
                        <td className="py-2 pr-3 font-mono text-[11px] text-muted-foreground italic">{b.campaign}</td>
                        <td className="py-2 px-3 text-right tabular-nums">
                          <span className="text-muted-foreground">0 / {b.total}</span>
                          <Delta a={0} b={b.total} />
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">0</td>
                        <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">0</td>
                        <td className="py-2 pl-3 text-muted-foreground italic">só no período B</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <Card className="p-4 space-y-3">
        <h2 className="font-display text-xl tracking-wide text-foreground">
          Por <span className="text-primary">tab_view</span>
        </h2>
        {aggA.tabs.length === 0 ? (
          <p className="text-xs text-muted-foreground italic font-body">Sem visualizações de aba ainda.</p>
        ) : (
          <div className="space-y-2">
            {aggA.tabs.map((t) => {
              const max = aggA.tabs[0].total || 1;
              const pct = (t.total / max) * 100;
              const sharePct = t.total ? (t.fromShare / t.total) * 100 : 0;
              const b = aggB?.tabs.find((x) => x.tab === t.tab);
              return (
                <div key={t.tab} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-body">
                    <span className="font-bold text-foreground">{t.tab}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {t.total} views · {t.visitors} visitantes · {sharePct.toFixed(0)}% share
                      {compareOn && (
                        <>
                          <span className="mx-1.5">·</span>
                          <span>B: {b?.total ?? 0}</span>
                          <Delta a={t.total} b={b?.total ?? 0} />
                        </>
                      )}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface overflow-hidden flex gap-px">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    {compareOn && b && (
                      <div className="h-full bg-muted-foreground/30 rounded-full" style={{ width: `${(b.total / max) * 100}%` }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <p className="text-[10px] text-muted-foreground font-body italic">
        Dados armazenados apenas no navegador (últimos 500 eventos). Para análise histórica completa, conecte um GA4/PostHog.
      </p>
    </div>
  );
}

const PeriodPicker = ({
  label,
  from,
  to,
  setFrom,
  setTo,
  accent,
}: {
  label: string;
  from: Date;
  to: Date;
  setFrom: (d: Date) => void;
  setTo: (d: Date) => void;
  accent: "primary" | "muted";
}) => (
  <div className="space-y-1.5">
    <p className={cn("text-[10px] uppercase tracking-wider font-body font-bold", accent === "primary" ? "text-primary" : "text-muted-foreground")}>
      {label}
    </p>
    <div className="flex items-center gap-2">
      <DateButton date={from} onChange={(d) => setFrom(startOfDay(d))} />
      <span className="text-muted-foreground text-xs">→</span>
      <DateButton date={to} onChange={(d) => setTo(endOfDay(d))} />
    </div>
  </div>
);

const DateButton = ({ date, onChange }: { date: Date; onChange: (d: Date) => void }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal text-xs min-h-[40px]">
        <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
        {format(date, "dd MMM yyyy", { locale: ptBR })}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="single"
        selected={date}
        onSelect={(d) => d && onChange(d)}
        initialFocus
        className={cn("p-3 pointer-events-auto")}
      />
    </PopoverContent>
  </Popover>
);

const Delta = ({ a, b }: { a: number; b: number }) => {
  if (b === 0 && a === 0) return null;
  const diff = a - b;
  const pct = b === 0 ? 100 : (diff / b) * 100;
  const Icon = diff > 0 ? ArrowUp : diff < 0 ? ArrowDown : Minus;
  const color = diff > 0 ? "text-primary" : diff < 0 ? "text-destructive" : "text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-0.5 ml-1 text-[10px] font-bold tabular-nums", color)}>
      <Icon className="h-2.5 w-2.5" />
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  compare,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  compare?: number;
}) => (
  <Card className="p-4 flex items-center gap-3">
    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="flex-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="font-display text-2xl text-foreground tabular-nums">{value}</p>
        {compare !== undefined && (
          <>
            <span className="text-[10px] text-muted-foreground font-body">vs {compare}</span>
            <Delta a={value} b={compare} />
          </>
        )}
      </div>
    </div>
  </Card>
);
