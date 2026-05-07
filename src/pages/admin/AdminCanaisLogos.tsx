import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { LOGO_OPTIONS, LOGO_REGISTRY, normalizeChannelName, type LogoKey } from "@/components/public/channelLogos";
import { ChannelBadge, BUILTIN_CHANNEL_MAP } from "@/components/public/ChannelBadge";
import { CHANNEL_MAPPINGS_QK, type ChannelMapping } from "@/hooks/useChannelMappings";

type FormState = {
  id?: string;
  name: string;
  logo_key: LogoKey;
  short: string;
  active: boolean;
};

const EMPTY_FORM: FormState = { name: "", logo_key: "none", short: "", active: true };

const AdminCanaisLogos = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [testName, setTestName] = useState("");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["channel_logo_mappings_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("channel_logo_mappings")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []) as ChannelMapping[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (f: FormState) => {
      const payload = {
        name: f.name.trim(),
        name_normalized: normalizeChannelName(f.name),
        logo_key: f.logo_key,
        short: f.short.trim() || null,
        active: f.active,
      };
      if (!payload.name) throw new Error("Nome obrigatório");
      if (!payload.name_normalized) throw new Error("Nome inválido");
      if (f.id) {
        const { error } = await supabase.from("channel_logo_mappings").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("channel_logo_mappings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Mapeamento salvo");
      qc.invalidateQueries({ queryKey: ["channel_logo_mappings_admin"] });
      qc.invalidateQueries({ queryKey: CHANNEL_MAPPINGS_QK });
      setOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("channel_logo_mappings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removido");
      qc.invalidateQueries({ queryKey: ["channel_logo_mappings_admin"] });
      qc.invalidateQueries({ queryKey: CHANNEL_MAPPINGS_QK });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao remover"),
  });

  const builtinList = useMemo(
    () =>
      Object.entries(BUILTIN_CHANNEL_MAP)
        .filter(([, v]) => v.logoKey)
        .map(([name, v]) => ({ name, logoKey: v.logoKey as LogoKey })),
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Canais & Logos</h1>
          <p className="text-sm text-muted-foreground">
            Mapeie variações de nomes (ex: "BandSports", "Band Play") para a logo correta sem mexer no código.
          </p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Novo
        </Button>
      </div>

      {/* Teste de matching */}
      <div className="rounded-lg border border-border/50 bg-card/40 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Search className="h-4 w-4 text-primary" /> Teste de matching
        </div>
        <p className="text-xs text-muted-foreground">
          Cole o nome de um canal exatamente como vem do parser e veja qual badge aparece agora.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="Ex: Bandsports HD"
            className="max-w-xs"
          />
          {testName.trim() && <ChannelBadge name={testName.trim()} size="md" />}
        </div>
      </div>

      {/* Mapeamentos do DB */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Mapeamentos personalizados ({rows?.length ?? 0})
        </h2>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando…</div>
        ) : (rows?.length ?? 0) === 0 ? (
          <div className="rounded-lg border border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground">
            Nenhum mapeamento ainda. Use o botão "Novo" para criar variações.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rows!.map((r) => {
              const entry = r.logo_key !== "none" ? LOGO_REGISTRY[r.logo_key as keyof typeof LOGO_REGISTRY] : null;
              return (
                <div key={r.id} className="rounded-lg border border-border/50 bg-card/40 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{r.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Logo: {entry?.label ?? "—"} {!r.active && "· Inativo"}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          setForm({
                            id: r.id,
                            name: r.name,
                            logo_key: r.logo_key,
                            short: r.short ?? "",
                            active: r.active,
                          });
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Remover mapeamento "${r.name}"?`)) remove.mutate(r.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <ChannelBadge name={r.name} size="md" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Built-in */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Mapeamentos padrão (built-in, somente leitura)
        </h2>
        <p className="text-xs text-muted-foreground">
          Estes nomes já são reconhecidos automaticamente. Crie um mapeamento personalizado apenas para variações novas.
        </p>
        <div className="flex flex-wrap gap-2">
          {builtinList.map((b) => (
            <ChannelBadge key={b.name} name={b.name} size="sm" />
          ))}
        </div>
      </div>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar mapeamento" : "Novo mapeamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ch-name">Nome do canal</Label>
              <Input
                id="ch-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: BandSports HD"
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground">
                Normalizado: <code>{normalizeChannelName(form.name) || "—"}</code>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Logo</Label>
              <Select
                value={form.logo_key}
                onValueChange={(v) => setForm((f) => ({ ...f, logo_key: v as LogoKey }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {LOGO_OPTIONS.map((o) => (
                    <SelectItem key={o.key} value={o.key}>
                      <div className="flex items-center gap-2">
                        {o.key !== "none" && (
                          <img
                            src={LOGO_REGISTRY[o.key as keyof typeof LOGO_REGISTRY].src}
                            alt=""
                            className="h-5 w-5 object-contain"
                          />
                        )}
                        <span>{o.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ch-short">Abreviação (opcional)</Label>
              <Input
                id="ch-short"
                value={form.short}
                onChange={(e) => setForm((f) => ({ ...f, short: e.target.value }))}
                placeholder="Ex: BandSp"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ch-active">Ativo</Label>
              <Switch
                id="ch-active"
                checked={form.active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
              />
            </div>

            {form.name.trim() && (
              <div className="rounded-md border border-border/40 bg-card/40 p-3 space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Preview</div>
                <ChannelBadge name={form.name.trim()} size="md" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending}>
              {upsert.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCanaisLogos;
