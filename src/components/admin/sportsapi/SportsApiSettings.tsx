import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Satellite, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useSettings, useUpdateSetting } from "@/hooks/useSettings";
import { useSportsApiSports } from "@/hooks/useSportsApi";

/** Esportes recomendados por padrão (ids na SportsAPI). */
export const DEFAULT_SPORTS = ["football", "basketball", "tennis", "mma", "volleyball", "futsal", "american-football", "baseball", "motorsport", "cycling", "golf"];

/** Rótulos em PT-BR para os IDs reais da SportsAPI (a API devolve `name` vazio). */
const SPORT_LABELS: Record<string, string> = {
  football: "Futebol", basketball: "Basquete / NBA", tennis: "Tênis", mma: "UFC / MMA",
  volleyball: "Vôlei", "beach-volley": "Vôlei de praia", futsal: "Futsal", "american-football": "Futebol americano (NFL)",
  baseball: "Beisebol (MLB)", motorsport: "Automobilismo (F1 / MotoGP)", cycling: "Ciclismo", golf: "Golfe",
  handball: "Handebol", "ice-hockey": "Hóquei no gelo (NHL)", "field-hockey": "Hóquei na grama", rugby: "Rugby",
  "rugby-league": "Rugby League", esports: "eSports", cricket: "Críquete", darts: "Dardos", snooker: "Sinuca",
  "table-tennis": "Tênis de mesa", badminton: "Badminton", padel: "Padel", waterpolo: "Polo aquático",
  minifootball: "Minifootball", bandy: "Bandy", floorball: "Floorball", "aussie-rules": "Futebol australiano", lacrosse: "Lacrosse",
};
const sportLabel = (id: string, name?: string) => name?.trim() || SPORT_LABELS[id] || id;
const FALLBACK_SPORTS = Object.entries(SPORT_LABELS).slice(0, 18);

type Mode = "manual" | "sugestoes" | "auto";

export const SportsApiSettings = () => {
  const { data: settings } = useSettings();
  const upd = useUpdateSetting();
  const sportsQ = useSportsApiSports();

  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState<Mode>("sugestoes");
  const [sports, setSports] = useState<string[]>(DEFAULT_SPORTS);
  const [priority, setPriority] = useState("");
  const [brazilOnly, setBrazilOnly] = useState(true);
  const [acceptKnown, setAcceptKnown] = useState(true);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [interval, setInterval] = useState("3");
  const [liveSec, setLiveSec] = useState("60");
  const [autoFetch, setAutoFetch] = useState(true);
  const [autoFetchMin, setAutoFetchMin] = useState("60");
  const [ignoreForeign, setIgnoreForeign] = useState(true);
  const [nightPause, setNightPause] = useState(true);
  const [dailyBudget, setDailyBudget] = useState("8000");
  const [maxPerSport, setMaxPerSport] = useState("40");

  useEffect(() => {
    if (!settings) return;
    setEnabled((settings.sportsapi_enabled ?? "true") !== "false");
    setMode((settings.sportsapi_mode as Mode) || "sugestoes");
    setSports((settings.sportsapi_sports_enabled ?? DEFAULT_SPORTS.join(",")).split(",").map((s) => s.trim()).filter(Boolean));
    setPriority(settings.sportsapi_sports_priority ?? "");
    setBrazilOnly((settings.sportsapi_brazil_only ?? "true") !== "false");
    setAcceptKnown((settings.sportsapi_accept_known_channel ?? "true") !== "false");
    setLiveUpdates((settings.sportsapi_live_updates ?? "true") !== "false");
    setInterval(settings.sportsapi_live_interval_min ?? "3");
    setLiveSec(settings.sportsapi_live_interval_live_sec ?? "60");
    setAutoFetch((settings.sportsapi_auto_fetch ?? "true") !== "false");
    setAutoFetchMin(settings.sportsapi_auto_fetch_interval_min ?? "60");
    setIgnoreForeign((settings.sportsapi_ignore_foreign ?? "true") !== "false");
    setNightPause((settings.sportsapi_night_pause ?? "true") !== "false");
    setDailyBudget(settings.sportsapi_daily_budget ?? "8000");
    setMaxPerSport(settings.sportsapi_max_per_sport ?? "40");
  }, [settings]);

  const availableSports = useMemo(() => {
    const fromApi = sportsQ.data?.sports ?? [];
    const list: [string, string][] = fromApi.length ? fromApi.map((s) => [s.id, sportLabel(s.id, s.name)]) : (FALLBACK_SPORTS as [string, string][]);
    // Garante que esportes já habilitados apareçam mesmo se a API não listar
    for (const s of sports) if (!list.some(([id]) => id === s)) list.push([s, s]);
    return list;
  }, [sportsQ.data, sports]);

  const toggleSport = (id: string) => setSports((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const save = async () => {
    const n = Number(interval);
    if (!Number.isFinite(n) || n < 1 || n > 60) return toast.error("Intervalo sem jogo ao vivo deve ficar entre 1 e 60 minutos.");
    const ls = Number(liveSec);
    if (!Number.isFinite(ls) || ls < 30 || ls > 600) return toast.error("Intervalo com jogo ao vivo deve ficar entre 30 e 600 segundos.");
    const af = Number(autoFetchMin);
    if (!Number.isFinite(af) || af < 15 || af > 360) return toast.error("Frequência de sugestões deve ficar entre 15 e 360 minutos.");
    const bud = Number(dailyBudget);
    if (!Number.isFinite(bud) || bud < 500 || bud > 10000) return toast.error("Orçamento diário deve ficar entre 500 e 10.000 requisições.");
    const m = Number(maxPerSport);
    if (!Number.isFinite(m) || m < 1 || m > 200) return toast.error("Máximo por esporte deve ficar entre 1 e 200.");
    if (sports.length === 0) return toast.error("Habilite pelo menos um esporte.");
    const pairs: [string, string][] = [
      ["sportsapi_enabled", String(enabled)],
      ["sportsapi_mode", mode],
      ["sportsapi_sports_enabled", sports.join(",")],
      ["sportsapi_sports_priority", priority.trim()],
      ["sportsapi_brazil_only", String(brazilOnly)],
      ["sportsapi_accept_known_channel", String(acceptKnown)],
      ["sportsapi_live_updates", String(liveUpdates)],
      ["sportsapi_live_interval_min", String(n)],
      ["sportsapi_live_interval_live_sec", String(ls)],
      ["sportsapi_auto_fetch", String(autoFetch)],
      ["sportsapi_auto_fetch_interval_min", String(af)],
      ["sportsapi_ignore_foreign", String(ignoreForeign)],
      ["sportsapi_night_pause", String(nightPause)],
      ["sportsapi_daily_budget", String(bud)],
      ["sportsapi_max_per_sport", String(m)],
    ];
    try {
      for (const [key, value] of pairs) await upd.mutateAsync({ key, value });
      toast.success("Configurações da SportsAPI salvas.");
    } catch {
      toast.error("Não foi possível salvar.");
    }
  };

  return (
    <div id="sportsapi" className="glass-panel rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Satellite className="h-4 w-4 text-emerald-400" /> SportsAPI
        </h3>
        <div className="flex items-center gap-2">
          <Label htmlFor="sportsapi-enabled" className="text-[11px] text-muted-foreground">{enabled ? "Ativa" : "Inativa"}</Label>
          <Switch id="sportsapi-enabled" checked={enabled} onCheckedChange={setEnabled} aria-label="Integração SportsAPI ativa" />
        </div>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-[11px] text-muted-foreground/80">
          A chave fica só no servidor. O site público nunca fala com a SportsAPI: o admin busca, revisa e publica.
        </p>

        <div className="space-y-1.5">
          <Label className="text-xs">Modo</Label>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Modo de importação">
            {([["manual", "Manual", "Só busca quando você pedir"], ["sugestoes", "Sugestões", "Recomendado: revisar antes de publicar"], ["auto", "Auto-importar sem alertas", "Importa jogos prontos sem canal desconhecido"]] as const).map(([v, l, d]) => (
              <button key={v} role="radio" aria-checked={mode === v} onClick={() => setMode(v)} title={d}
                className={`min-h-11 px-3 rounded-lg text-[11px] font-semibold border text-left ${mode === v ? "bg-primary/15 border-primary/40 text-primary" : "border-white/[0.08] text-muted-foreground hover:text-foreground"}`}>
                {l}
                <span className="block text-[9px] font-normal opacity-70">{d}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Filtro de transmissão</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <ToggleRow id="brazil-only" label="Importar somente com transmissão Brasil" hint="País BR/Brazil/Brasil na transmissão." checked={brazilOnly} onChange={setBrazilOnly} />
          <ToggleRow id="accept-known" label="Aceitar canal cadastrado mesmo sem país" hint="Usa o cadastro de canais/apelidos (ESPN2 → ESPN 2, PFC → Premiere)." checked={acceptKnown} onChange={setAcceptKnown} />
          <ToggleRow id="ignore-foreign" label="Ignorar canais estrangeiros automaticamente" hint="ESPN (Usa), ESPN Deportes, TNT Argentina… nunca entram." checked={ignoreForeign} onChange={setIgnoreForeign} />
          <div className="space-y-1">
            <Label htmlFor="sa-max" className="text-[11px]">Máx. de jogos por esporte</Label>
            <Input id="sa-max" type="number" min={1} max={200} value={maxPerSport} onChange={(e) => setMaxPerSport(e.target.value)} className="h-11" />
          </div>
        </div>

        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Automação</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <ToggleRow id="auto-fetch" label="Buscar sugestões automaticamente" hint="Hoje e amanhã, entre 6h e 23h. Não publica nada sozinho no modo Sugestões." checked={autoFetch} onChange={setAutoFetch} />
          <div className="space-y-1">
            <Label htmlFor="sa-autofetch" className="text-[11px]">Frequência das sugestões (min)</Label>
            <Input id="sa-autofetch" type="number" min={15} max={360} value={autoFetchMin} onChange={(e) => setAutoFetchMin(e.target.value)} className="h-11" disabled={!autoFetch} />
          </div>
          <ToggleRow id="live-updates" label="Atualizar placares ao vivo" hint="Só jogos publicados (manuais ou importados) perto do horário, em andamento ou recém-encerrados." checked={liveUpdates} onChange={setLiveUpdates} />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="sa-live-sec" className="text-[11px]">Com jogo ao vivo (s)</Label>
              <Input id="sa-live-sec" type="number" min={30} max={600} value={liveSec} onChange={(e) => setLiveSec(e.target.value)} className="h-11" disabled={!liveUpdates} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sa-interval" className="text-[11px]">Sem jogo ao vivo (min)</Label>
              <Input id="sa-interval" type="number" min={1} max={60} value={interval} onChange={(e) => setInterval(e.target.value)} className="h-11" disabled={!liveUpdates} />
            </div>
          </div>
          <ToggleRow id="night-pause" label="Pausar de madrugada" hint="Sem busca 23h–6h e sem placar 2h–6h (exceto jogo ao vivo)." checked={nightPause} onChange={setNightPause} />
          <div className="space-y-1">
            <Label htmlFor="sa-budget" className="text-[11px]">Orçamento diário (requisições)</Label>
            <Input id="sa-budget" type="number" min={500} max={10000} value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} className="h-11" />
            <p className="text-[10px] text-muted-foreground/70">Plano Pro: 300 mil/mês ≈ 10 mil/dia. Ao chegar a 80%, a frequência cai pela metade.</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Esportes habilitados ({sports.length})</Label>
            <button onClick={() => sportsQ.refetch()} className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 min-h-9 px-1" disabled={sportsQ.isFetching}>
              {sportsQ.isFetching ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Atualizar lista da API
            </button>
          </div>
          {sportsQ.isError && <p className="text-[10px] text-amber-300">Não foi possível listar esportes da API ({(sportsQ.error as Error).message}). Usando lista padrão.</p>}
          <div className="flex flex-wrap gap-1.5">
            {availableSports.map(([id, name]) => (
              <button key={id} onClick={() => toggleSport(id)} aria-pressed={sports.includes(id)}
                className={`min-h-10 px-2.5 rounded-full text-[11px] border ${sports.includes(id) ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200" : "border-white/[0.08] text-muted-foreground hover:text-foreground"}`}>
                {name}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="text-[10px] h-8" onClick={() => setSports(DEFAULT_SPORTS)}>Restaurar padrão recomendado</Button>
        </div>

        <div className="space-y-1">
          <Label htmlFor="sa-priority" className="text-xs">Prioridade de exibição (ids separados por vírgula)</Label>
          <Input id="sa-priority" value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="football,basketball,tennis" className="h-11" />
        </div>

        <Button onClick={save} disabled={upd.isPending} className="min-h-11 gap-1.5">
          {upd.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar SportsAPI
        </Button>
      </div>
    </div>
  );
};

const ToggleRow = ({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 min-h-11">
    <div className="min-w-0">
      <Label htmlFor={id} className="text-[12px] text-foreground">{label}</Label>
      <p className="text-[10px] text-muted-foreground/70">{hint}</p>
    </div>
    <Switch id={id} checked={checked} onCheckedChange={onChange} />
  </div>
);
