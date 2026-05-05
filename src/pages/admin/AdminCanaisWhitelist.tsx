import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Save, Globe } from "lucide-react";
import { toast } from "sonner";

type WL = {
  id: string;
  channel_pattern: string;
  match_type: "contains" | "exact" | "regex";
  country: string | null;
  active: boolean;
  notes: string | null;
};

const empty = (): Partial<WL> => ({
  channel_pattern: "",
  match_type: "contains",
  country: "World",
  active: true,
  notes: "",
});

const AdminCanaisWhitelist = () => {
  const [rows, setRows] = useState<WL[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Partial<WL>>(empty());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("channel_whitelist")
      .select("*")
      .order("channel_pattern");
    if (error) toast.error("Erro ao carregar: " + error.message);
    setRows((data as WL[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft.channel_pattern?.trim()) return toast.error("Informe o padrão do canal");
    setSaving(true);
    const { error } = await supabase.from("channel_whitelist").insert({
      channel_pattern: draft.channel_pattern.trim(),
      match_type: draft.match_type || "contains",
      country: draft.country || null,
      active: draft.active ?? true,
      notes: draft.notes || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Canal adicionado à whitelist");
    setDraft(empty());
    load();
  };

  const updateRow = async (id: string, patch: Partial<WL>) => {
    const { error } = await supabase.from("channel_whitelist").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este canal da whitelist?")) return;
    const { error } = await supabase.from("channel_whitelist").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    load();
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6">
      <header className="flex items-center gap-3">
        <Globe className="h-6 w-6 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold font-heading">Whitelist Global de Canais</h1>
          <p className="text-sm text-muted-foreground">
            Marcas globais (NBA League Pass, Disney+, Max, F1 TV…) aceitas mesmo quando a API marca como "World".
          </p>
        </div>
      </header>

      <Card className="p-4 space-y-3 border-cyan-500/20 bg-cyan-500/[0.03]">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" /> Adicionar canal
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Padrão do canal *</Label>
            <Input
              placeholder="ex.: NBA League Pass, Disney+"
              value={draft.channel_pattern || ""}
              onChange={(e) => setDraft({ ...draft, channel_pattern: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select
              value={draft.match_type || "contains"}
              onValueChange={(v) => setDraft({ ...draft, match_type: v as WL["match_type"] })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="contains">Contém</SelectItem>
                <SelectItem value="exact">Exato</SelectItem>
                <SelectItem value="regex">Regex</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">País (informativo)</Label>
            <Input
              placeholder="World, Brazil…"
              value={draft.country || ""}
              onChange={(e) => setDraft({ ...draft, country: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Notas</Label>
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

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {loading ? "Carregando..." : `${rows.length} canais na whitelist`}
        </h2>
        {rows.map((r) => (
          <Card key={r.id} className="p-3 flex flex-wrap items-center gap-2">
            <Badge variant={r.active ? "default" : "secondary"}>{r.match_type}</Badge>
            {r.country && <Badge variant="outline">{r.country}</Badge>}
            <code className="text-sm font-mono flex-1">{r.channel_pattern}</code>
            {r.notes && <span className="text-xs text-muted-foreground italic">{r.notes}</span>}
            <Switch checked={r.active} onCheckedChange={(v) => updateRow(r.id, { active: v })} />
            <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminCanaisWhitelist;
