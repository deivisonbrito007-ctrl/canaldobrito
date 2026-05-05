import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Save, Tv } from "lucide-react";
import { toast } from "sonner";

type Override = {
  id: string;
  competition_pattern: string;
  match_type: "contains" | "exact" | "regex";
  sport_type: string | null;
  channels: string[];
  priority: number;
  active: boolean;
  notes: string | null;
  home_team_pattern: string | null;
  away_team_pattern: string | null;
  event_date: string | null;
};

const SPORTS = ["", "football", "basketball", "baseball", "ice-hockey", "american-football", "motorsport", "fighting", "tennis", "volleyball", "cycling", "golf"];

const empty = (): Partial<Override> => ({
  competition_pattern: "",
  match_type: "contains",
  sport_type: null,
  channels: [],
  priority: 100,
  active: true,
  notes: "",
  home_team_pattern: "",
  away_team_pattern: "",
  event_date: null,
});

const AdminCanais = () => {
  const [rows, setRows] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Partial<Override>>(empty());
  const [draftChannels, setDraftChannels] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("broadcast_overrides")
      .select("*")
      .order("priority", { ascending: false })
      .order("competition_pattern");
    if (error) toast.error("Erro ao carregar: " + error.message);
    setRows((data as Override[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft.competition_pattern?.trim()) return toast.error("Informe o padrão da competição");
    const channels = draftChannels.split(",").map((s) => s.trim()).filter(Boolean);
    if (!channels.length) return toast.error("Informe ao menos 1 canal");
    setSaving(true);
    const { error } = await supabase.from("broadcast_overrides").insert({
      competition_pattern: draft.competition_pattern.trim(),
      match_type: draft.match_type || "contains",
      sport_type: draft.sport_type || null,
      channels,
      priority: draft.priority ?? 100,
      active: draft.active ?? true,
      notes: draft.notes || null,
      home_team_pattern: draft.home_team_pattern?.trim() || null,
      away_team_pattern: draft.away_team_pattern?.trim() || null,
      event_date: draft.event_date || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Override criado");
    setDraft(empty());
    setDraftChannels("");
    load();
  };

  const updateRow = async (id: string, patch: Partial<Override>) => {
    const { error } = await supabase.from("broadcast_overrides").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este override?")) return;
    const { error } = await supabase.from("broadcast_overrides").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    load();
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6">
      <header className="flex items-center gap-3">
        <Tv className="h-6 w-6 text-fuchsia-400" />
        <div>
          <h1 className="text-2xl font-bold font-heading">Canais por Competição</h1>
          <p className="text-sm text-muted-foreground">
            Mapeamento persistente de canais BR. Aplicado pelo sync quando a API não trouxer transmissão.
          </p>
        </div>
      </header>

      {/* Novo override */}
      <Card className="p-4 space-y-3 border-fuchsia-500/20 bg-fuchsia-500/[0.03]">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" /> Novo override
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Padrão da competição *</Label>
            <Input
              placeholder="ex.: brasileirão, NBA Finals, /champions/"
              value={draft.competition_pattern || ""}
              onChange={(e) => setDraft({ ...draft, competition_pattern: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select
              value={draft.match_type || "contains"}
              onValueChange={(v) => setDraft({ ...draft, match_type: v as Override["match_type"] })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="contains">Contém (padrão)</SelectItem>
                <SelectItem value="exact">Exato</SelectItem>
                <SelectItem value="regex">Regex</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Esporte (opcional)</Label>
            <Select
              value={draft.sport_type || "any"}
              onValueChange={(v) => setDraft({ ...draft, sport_type: v === "any" ? null : v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Qualquer</SelectItem>
                {SPORTS.filter(Boolean).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Prioridade</Label>
            <Input
              type="number"
              value={draft.priority ?? 100}
              onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Canais (separados por vírgula) *</Label>
            <Input
              placeholder="ESPN Brasil, Disney+, SporTV"
              value={draftChannels}
              onChange={(e) => setDraftChannels(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Time da casa (opcional, override por partida)</Label>
            <Input
              placeholder="ex.: Palmeiras"
              value={draft.home_team_pattern || ""}
              onChange={(e) => setDraft({ ...draft, home_team_pattern: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Time visitante (opcional)</Label>
            <Input
              placeholder="ex.: Flamengo"
              value={draft.away_team_pattern || ""}
              onChange={(e) => setDraft({ ...draft, away_team_pattern: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Data específica (opcional)</Label>
            <Input
              type="date"
              value={draft.event_date || ""}
              onChange={(e) => setDraft({ ...draft, event_date: e.target.value || null })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Notas (opcional)</Label>
            <Input
              value={draft.notes || ""}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={create} disabled={saving} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Adicionar"}
        </Button>
      </Card>

      {/* Lista */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {loading ? "Carregando..." : `${rows.length} overrides cadastrados`}
        </h2>
        {rows.map((r) => (
          <Card key={r.id} className="p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={r.active ? "default" : "secondary"}>{r.match_type}</Badge>
              {r.sport_type && <Badge variant="outline">{r.sport_type}</Badge>}
              <Badge variant="outline">prio {r.priority}</Badge>
              {(r.home_team_pattern || r.away_team_pattern) && (
                <Badge variant="default" className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40">
                  partida: {r.home_team_pattern || "*"} vs {r.away_team_pattern || "*"}
                  {r.event_date ? ` (${r.event_date})` : ""}
                </Badge>
              )}
              <code className="text-sm font-mono flex-1">{r.competition_pattern || "—"}</code>
              <Switch
                checked={r.active}
                onCheckedChange={(v) => updateRow(r.id, { active: v })}
              />
              <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {r.channels.map((c) => (
                <Badge key={c} variant="secondary" className="font-normal">{c}</Badge>
              ))}
            </div>
            {r.notes && <p className="text-xs text-muted-foreground italic">{r.notes}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminCanais;
