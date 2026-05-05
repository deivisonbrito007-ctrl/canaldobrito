import { useEffect, useMemo, useState } from "react";
import { BarChart3, RefreshCw, Trash2, Users, MousePointerClick } from "lucide-react";
import { readEventsLog, clearEventsLog, type LoggedEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const TIME_WINDOWS: Record<string, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "tudo": Infinity,
};

type WindowKey = keyof typeof TIME_WINDOWS;

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

export default function AdminAnalytics() {
  const [events, setEvents] = useState<LoggedEvent[]>([]);
  const [windowKey, setWindowKey] = useState<WindowKey>("7d");

  const refresh = () => setEvents(readEventsLog());
  useEffect(() => { refresh(); }, []);

  const cutoff = useMemo(() => Date.now() - TIME_WINDOWS[windowKey], [windowKey]);
  const filtered = useMemo(() => events.filter((e) => e.ts >= cutoff), [events, cutoff]);

  const { campaigns, tabs, totals } = useMemo(() => {
    const campaignMap = new Map<string, CampaignRow>();
    const tabMap = new Map<string, TabRow>();
    const allVisitors = new Set<string>();
    const allSessions = new Set<string>();

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
      }

      if (ev.event === "tab_view") {
        const tab = (ev.props.tab as string) || "—";
        const row = tabMap.get(tab) ?? { tab, total: 0, fromShare: 0, visitors: 0 };
        row.total += 1;
        if (ev.props.from_share) row.fromShare += 1;
        tabMap.set(tab, row);
      }
    }

    // Compute unique visitors/sessions per campaign
    for (const [campaign, row] of campaignMap) {
      const v = new Set<string>();
      const s = new Set<string>();
      for (const ev of filtered) {
        if ((ev.props.utm_campaign as string) === (campaign === "(direct)" ? undefined : campaign)) {
          v.add(String(ev.props.user_id ?? ""));
          s.add(String(ev.props.session_id ?? ""));
        } else if (campaign === "(direct)" && !ev.props.utm_campaign) {
          v.add(String(ev.props.user_id ?? ""));
          s.add(String(ev.props.session_id ?? ""));
        }
      }
      row.visitors = v.size;
      row.sessions = s.size;
    }

    // Visitors per tab
    for (const [tab, row] of tabMap) {
      const v = new Set<string>();
      for (const ev of filtered) {
        if (ev.event === "tab_view" && (ev.props.tab as string) === tab) {
          v.add(String(ev.props.user_id ?? ""));
        }
      }
      row.visitors = v.size;
    }

    return {
      campaigns: Array.from(campaignMap.values()).sort((a, b) => b.total - a.total),
      tabs: Array.from(tabMap.values()).sort((a, b) => b.total - a.total),
      totals: {
        events: filtered.length,
        visitors: allVisitors.size,
        sessions: allSessions.size,
      },
    };
  }, [filtered]);

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
            Resumo local dos eventos `landing_with_utm`, `tab_view` e `content_card_click`.
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

      {/* Time window */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TIME_WINDOWS) as WindowKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setWindowKey(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors min-h-[36px] ${
              windowKey === k
                ? "bg-primary text-primary-foreground"
                : "bg-surface border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={MousePointerClick} label="Eventos" value={totals.events} />
        <StatCard icon={Users} label="Visitantes únicos" value={totals.visitors} />
        <StatCard icon={Users} label="Sessões" value={totals.sessions} />
      </div>

      {/* Campaigns */}
      <Card className="p-4 space-y-3">
        <h2 className="font-display text-xl tracking-wide text-foreground">
          Por <span className="text-primary">utm_campaign</span>
        </h2>
        {campaigns.length === 0 ? (
          <p className="text-xs text-muted-foreground italic font-body">Sem dados na janela selecionada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-body">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Campaign</th>
                  <th className="py-2 px-3 text-right">Eventos</th>
                  <th className="py-2 px-3 text-right">Visitantes</th>
                  <th className="py-2 px-3 text-right">Sessões</th>
                  <th className="py-2 pl-3">Top abas</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.campaign} className="border-b border-border/30">
                    <td className="py-2 pr-3 font-mono text-[11px] text-foreground">{c.campaign}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-primary font-bold">{c.total}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{c.visitors}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{c.sessions}</td>
                    <td className="py-2 pl-3 text-muted-foreground">
                      {Array.from(c.byTab.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([t, n]) => `${t} (${n})`)
                        .join(", ")}
                    </td>
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
        {tabs.length === 0 ? (
          <p className="text-xs text-muted-foreground italic font-body">Sem visualizações de aba ainda.</p>
        ) : (
          <div className="space-y-2">
            {tabs.map((t) => {
              const max = tabs[0].total || 1;
              const pct = (t.total / max) * 100;
              const sharePct = t.total ? (t.fromShare / t.total) * 100 : 0;
              return (
                <div key={t.tab} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-body">
                    <span className="font-bold text-foreground">{t.tab}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {t.total} views · {t.visitors} visitantes · {sharePct.toFixed(0)}% de share
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <p className="text-[10px] text-muted-foreground font-body italic">
        Dados armazenados apenas no navegador (últimos {500} eventos). Para análise de toda a base, conecte um GA4/PostHog.
      </p>
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) => (
  <Card className="p-4 flex items-center gap-3">
    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="flex-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body">{label}</p>
      <p className="font-display text-2xl text-foreground tabular-nums">{value}</p>
    </div>
  </Card>
);
