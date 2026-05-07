import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pencil, Trash2, Plus, Search, AlertTriangle, RefreshCcw, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { LOGO_OPTIONS, LOGO_REGISTRY, normalizeChannelName, type LogoKey } from "@/components/public/channelLogos";
import { ChannelBadge, BUILTIN_CHANNEL_MAP } from "@/components/public/ChannelBadge";
import { CHANNEL_MAPPINGS_QK, type ChannelMapping } from "@/hooks/useChannelMappings";
import { useDiscoveredChannels, type DiscoveredChannel } from "@/hooks/useDiscoveredChannels";
import { ChannelLogoUpload } from "@/components/admin/ChannelLogoUpload";

type FormState = {
  id?: string;
  name: string;
  logo_key: LogoKey;
  short: string;
  active: boolean;
  custom_logo_url: string | null;
  light_chip: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  logo_key: "none",
  short: "",
  active: true,
  custom_logo_url: null,
  light_chip: false,
};

const AdminCanaisLogos = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [logoTab, setLogoTab] = useState<"registry" | "upload">("registry");
  const [testName, setTestName] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"orphans" | "all" | "custom" | "builtin">("orphans");

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

  const discovered = useDiscoveredChannels();

  const upsert = useMutation({
    mutationFn: async (f: FormState) => {
      const payload = {
        name: f.name.trim(),
        name_normalized: normalizeChannelName(f.name),
        logo_key: f.logo_key,
        short: f.short.trim() || null,
        active: f.active,
        custom_logo_url: f.custom_logo_url,
        light_chip: f.light_chip,
      };
      if (!payload.name) throw new Error("Nome obrigatório");
      if (!payload.name_normalized) throw new Error("Nome inválido");
      if (f.id) {
        const { error } = await supabase.from("channel_logo_mappings").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("channel_logo_mappings")
          .upsert(payload, { onConflict: "name_normalized" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Mapeamento salvo");
      qc.invalidateQueries({ queryKey: ["channel_logo_mappings_admin"] });
      qc.invalidateQueries({ queryKey: CHANNEL_MAPPINGS_QK });
      qc.invalidateQueries({ queryKey: ["discovered-channels"] });
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
      qc.invalidateQueries({ queryKey: ["discovered-channels"] });
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

  const stats = useMemo(() => {
    return {
      mapped: rows?.length ?? 0,
      orphans: discovered.orphans.length,
      builtin: builtinList.length,
      discovered: discovered.all.length,
    };
  }, [rows, discovered, builtinList]);

  const openEdit = (r: ChannelMapping) => {
    setForm({
      id: r.id,
      name: r.name,
      logo_key: r.logo_key,
      short: r.short ?? "",
      active: r.active,
      custom_logo_url: r.custom_logo_url ?? null,
      light_chip: !!r.light_chip,
    });
    setLogoTab(r.custom_logo_url ? "upload" : "registry");
    setOpen(true);
  };

  const openNew = (prefillName?: string) => {
    setForm({ ...EMPTY_FORM, name: prefillName ?? "" });
    setLogoTab(prefillName ? "upload" : "registry");
    setOpen(true);
  };

  // Filtered list for current tab
  const visibleCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filterByQuery = <T extends { name: string }>(arr: T[]) =>
      q ? arr.filter((i) => i.name.toLowerCase().includes(q)) : arr;

    if (tab === "orphans") return filterByQuery(discovered.orphans);
    if (tab === "all") return filterByQuery(discovered.all);
    if (tab === "custom") {
      const list: DiscoveredChannel[] = (rows ?? []).map((r) => ({
        name: r.name,
        normalized: r.name_normalized,
        count: discovered.all.find((d) => d.normalized === r.name_normalized)?.count ?? 0,
        mapping: r,
        isBuiltin: false,
        isOrphan: false,
      }));
      return filterByQuery(list);
    }
    return filterByQuery(
      builtinList.map((b) => ({
        name: b.name,
        normalized: normalizeChannelName(b.name),
        count: discovered.all.find((d) => d.normalized === normalizeChannelName(b.name))?.count ?? 0,
        isBuiltin: true,
        isOrphan: false,
      }))
    );
  }, [tab, search, discovered, rows, builtinList]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Canais & Logos</h1>
          <p className="text-sm text-muted-foreground">
            Painel central de canais detectados, com upload de logo direto da tela.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => discovered.refetch()} className="gap-2">
            <RefreshCcw className="h-4 w-4" /> Detectar agora
          </Button>
          <Button onClick={() => openNew()} className="gap-2">
            <Plus className="h-4 w-4" /> Novo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Sparkles className="h-4 w-4" />} label="Detectados (30d)" value={stats.discovered} />
        <StatCard icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} label="Personalizados" value={stats.mapped} />
        <StatCard icon={<CheckCircle2 className="h-4 w-4 text-sky-400" />} label="Built-in" value={stats.builtin} />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
          label="Sem logo"
          value={stats.orphans}
          highlight={stats.orphans > 0}
        />
      </div>

      {stats.orphans > 0 && (
        <button
          onClick={() => setTab("orphans")}
          className="w-full rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-200 hover:bg-amber-500/15 transition"
        >
          <span className="font-bold">⚠ {stats.orphans} canal{stats.orphans > 1 ? "is" : ""} sem logo</span>{" "}
          aparece{stats.orphans > 1 ? "m" : ""} nos jogos. Toque para resolver →
        </button>
      )}

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

      {/* Tabs + Search */}
      <div className="space-y-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <TabsList>
              <TabsTrigger value="orphans" className="gap-2">
                Sem logo
                {stats.orphans > 0 && (
                  <span className="rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-bold px-1.5">
                    {stats.orphans}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="all">Todos detectados</TabsTrigger>
              <TabsTrigger value="custom">Personalizados</TabsTrigger>
              <TabsTrigger value="builtin">Built-in</TabsTrigger>
            </TabsList>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar canal…"
              className="max-w-xs h-9"
            />
          </div>

          <TabsContent value={tab} className="mt-4">
            {(tab === "orphans" || tab === "all") && discovered.isLoading ? (
              <div className="text-sm text-muted-foreground">Carregando canais detectados…</div>
            ) : tab === "custom" && isLoading ? (
              <div className="text-sm text-muted-foreground">Carregando…</div>
            ) : visibleCards.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/40 p-8 text-center text-sm text-muted-foreground">
                {tab === "orphans"
                  ? "🎉 Todos os canais detectados têm logo!"
                  : "Nenhum canal encontrado."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {visibleCards.map((c) => (
                  <ChannelCard
                    key={c.normalized + (c.mapping?.id ?? "")}
                    channel={c}
                    onEdit={() => (c.mapping ? openEdit(c.mapping) : openNew(c.name))}
                    onDelete={() => {
                      if (c.mapping && confirm(`Remover mapeamento "${c.mapping.name}"?`)) {
                        remove.mutate(c.mapping.id);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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

            <div className="space-y-2">
              <Label>Logo</Label>
              <Tabs value={logoTab} onValueChange={(v) => setLogoTab(v as typeof logoTab)}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="registry">Da biblioteca</TabsTrigger>
                  <TabsTrigger value="upload">Upload personalizado</TabsTrigger>
                </TabsList>
                <TabsContent value="registry" className="mt-3 space-y-2">
                  <Select
                    value={form.logo_key}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, logo_key: v as LogoKey, custom_logo_url: null }))
                    }
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
                  <p className="text-[10px] text-muted-foreground">
                    Use uma logo já embutida no código (recomendado quando existir).
                  </p>
                </TabsContent>
                <TabsContent value="upload" className="mt-3">
                  <ChannelLogoUpload
                    channelName={form.name}
                    currentUrl={form.custom_logo_url}
                    onUploaded={(url) =>
                      setForm((f) => ({ ...f, custom_logo_url: url, logo_key: "none" }))
                    }
                    onCleared={() => setForm((f) => ({ ...f, custom_logo_url: null }))}
                  />
                </TabsContent>
              </Tabs>
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
              <div>
                <Label htmlFor="ch-light">Fundo claro</Label>
                <p className="text-[10px] text-muted-foreground">
                  Use se a logo é escura e some no chip transparente.
                </p>
              </div>
              <Switch
                id="ch-light"
                checked={form.light_chip}
                onCheckedChange={(v) => setForm((f) => ({ ...f, light_chip: v }))}
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
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Preview ao vivo
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ChannelBadge name={form.name.trim()} size="sm" />
                  <ChannelBadge name={form.name.trim()} size="md" />
                  <ChannelBadge name={form.name.trim()} size="lg" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {form.id && (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive sm:mr-auto"
                onClick={() => {
                  if (confirm(`Remover "${form.name}"?`)) {
                    remove.mutate(form.id!);
                    setOpen(false);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Excluir
              </Button>
            )}
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

const StatCard = ({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
}) => (
  <div
    className={`rounded-lg border p-3 ${
      highlight
        ? "border-amber-500/40 bg-amber-500/10"
        : "border-border/50 bg-card/40"
    }`}
  >
    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
      {icon}
      {label}
    </div>
    <div className="mt-1 font-display text-2xl font-bold">{value}</div>
  </div>
);

const ChannelCard = ({
  channel,
  onEdit,
  onDelete,
}: {
  channel: DiscoveredChannel;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const m = channel.mapping;
  const tag = channel.isOrphan
    ? { label: "Sem logo", cls: "bg-amber-500/20 text-amber-200" }
    : m
    ? { label: "Personalizado", cls: "bg-emerald-500/20 text-emerald-200" }
    : channel.isBuiltin
    ? { label: "Built-in", cls: "bg-sky-500/20 text-sky-200" }
    : { label: "—", cls: "bg-muted/40 text-muted-foreground" };

  return (
    <div className="rounded-lg border border-border/50 bg-card/40 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${tag.cls}`}>
              {tag.label}
            </span>
            {channel.count > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {channel.count} jogo{channel.count > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="mt-1 font-semibold truncate text-sm">{channel.name}</div>
          {m && !m.active && (
            <div className="text-[10px] text-amber-300">Inativo</div>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit} aria-label="Editar">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {m && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDelete}
              aria-label="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      <ChannelBadge name={channel.name} size="md" />
      {channel.isOrphan && (
        <Button size="sm" variant="outline" onClick={onEdit} className="w-full gap-1 mt-1 h-8 text-xs">
          <Plus className="h-3 w-3" /> Adicionar logo
        </Button>
      )}
    </div>
  );
};

export default AdminCanaisLogos;
