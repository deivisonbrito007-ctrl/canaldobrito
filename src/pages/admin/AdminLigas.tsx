import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Save, ListFilter } from "lucide-react";
import { toast } from "sonner";

type Allow = {
  id: string;
  competition_pattern: string;
  match_type: "contains" | "exact" | "regex";
  sport_type: string | null;
  priority: number;
  active: boolean;
  notes: string | null;
};

const SPORTS = ["football", "basketball", "baseball", "hockey", "f1", "mma", "tennis", "volleyball", "cycling", "golf", "rugby", "surf"];

const empty = (): Partial<Allow> => ({
  competition_pattern: "",
  match_type: "contains",
  sport_type: null,
  priority: 100,
  active: true,
  notes: "",
});

const AdminLigas = () => {
  const [rows, setRows] = useState<Allow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Partial<Allow>>(empty());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("league_allowlist" as any)
      .select("*")
      .order("sport_type", { ascending: true })
      .order("competition_pattern", { ascending: true });
    if (error) toast.error("Erro ao carregar: " + error.message);
    setRows(((data as any[]) || []) as Allow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft.competition_pattern?.trim()) return toast.error("Informe o padrão da competição");
    setSaving(true);
    const { error } = await supabase.from("league_allowlist" as any).insert({
      competition_pattern: draft.competition_pattern.trim(),
      match_type: draft.match_type || "contains",
      sport_type: draft.sport_type || null,
      priority: draft.priority ?? 100,
      active: draft.active ?? true,
      notes: draft.notes || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Liga adicionada");
    setDraft(empty());
    load();
  };

  const updateRow = async (id: string, patch: Partial<Allow>) => {
    const { error } = await supabase.from("league_allowlist" as any).update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover liga da lista permitida?")) return;
    const { error } = await supabase.from("league_allowlist" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    load();
  };

  const grouped = rows.reduce<Record<string, Allow[]>>((acc, r) => {
    const k = r.sport_type || "qualquer";
    (acc[k] ||= []).push(r);
    return acc;
  }, {});

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6">
      <header className="flex items-center gap-3">
        <ListFilter className="h-6 w-6 text-emerald-400" />
        <div>
          <h1 className="text-2xl font-bold font-heading">Ligas Permitidas</h1>
          <p className="text-sm text-muted-foreground">
            Apenas competições cadastradas aqui aparecem na programação. Ligas fora da lista são ignoradas pelo sync.
          </p>
        </div>
      </header>

      <Card className="p-3 border-amber-500/30 bg-amber-500/[0.05] text-amber-200 text-xs">
        <strong className="block mb-1 text-amber-300">Como funciona</strong>
        Cada padrão é comparado com o nome da competição vindo da API. Use <code>contém</code> para palavras-chave (ex: <code>brasileir</code>, <code>champions</code>), <code>exato</code> para nomes precisos (ex: <code>NBA</code>, <code>NFL</code>) e <code>regex</code> para casos avançados.
        Se a lista estiver vazia, o sync volta a aceitar todas as ligas.
      </Card>

      {/* Novo */}
      <Card className="p-4 space-y-3 border-emerald-500/20 bg-emerald-500/[0.03]">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" /> Adicionar liga
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Padrão da competição *</Label>
            <Input
              placeholder="ex.: brasileir, NBA, champions, formula 1"
              value={draft.competition_pattern || ""}
              onChange={(e) => setDraft({ ...draft, competition_pattern: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select
              value={draft.match_type || "contains"}
              onValueChange={(v) => setDraft({ ...draft, match_type: v as Allow["match_type"] })}
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
                {SPORTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
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

      {/* Lista agrupada */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {loading ? "Carregando..." : `${rows.length} ligas cadastradas`}
        </h2>
        {Object.entries(grouped).map(([sport, list]) => (
          <div key={sport} className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">{sport}</h3>
            {list.map((r) => (
              <Card key={r.id} className="p-3 flex flex-wrap items-center gap-2">
                <Badge variant={r.active ? "default" : "secondary"}>{r.match_type}</Badge>
                <code className="text-sm font-mono flex-1 min-w-[180px]">{r.competition_pattern}</code>
                {r.notes && <span className="text-[10px] text-muted-foreground italic">{r.notes}</span>}
                <Switch
                  checked={r.active}
                  onCheckedChange={(v) => updateRow(r.id, { active: v })}
                />
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminLigas;
