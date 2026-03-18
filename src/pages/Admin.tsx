import { useState, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus, Pencil, Trash2, LogOut, ArrowLeft, RefreshCw,
  Tv, Trophy, Wifi, Calendar, Search, Filter,
  LayoutGrid, List, Zap, Image, Upload,
} from "lucide-react";
import { LiveBadge } from "@/components/LiveBadge";
import { SPORTS } from "@/types/sports";
import logo from "@/assets/logo_brito_solutions_sem_fundo.png";
import type { TablesInsert } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  useBanners,
  useUploadBanner,
  useToggleBanner,
  useDeleteBanner,
  BANNER_CATEGORIES,
  type BannerCategory,
} from "@/hooks/useBanners";

type GameInsert = TablesInsert<"games">;

const BROADCAST_CHANNELS = [
  "Globo", "SporTV", "Premiere", "ESPN", "Star+", "TNT Sports", "Max",
  "Paramount+", "CazéTV", "Amazon Prime", "Band", "Record", "OneFootball",
  "Globo / SporTV", "Premiere / Globo", "ESPN / Paramount+", "TNT Sports / Max",
  "SporTV / ESPN", "Record / CazéTV", "Band / SporTV",
  "Apple TV+", "BandSports / CazéTV", "ESPN / Star+",
  "NFL Game Pass", "ESPN / NFL Game Pass", "F1 TV", "Band / F1 TV",
  "Combate", "UFC Fight Pass", "Combate / UFC Fight Pass",
  "ESPN / SporTV",
];

const INITIAL_FORM: Partial<GameInsert & { broadcast_channel?: string }> = {
  sport: "football",
  league: "",
  home_team_name: "",
  away_team_name: "",
  start_time: "",
  status: "scheduled",
  venue: "",
  round: "",
  highlight: false,
  api_source: "manual",
  home_team_score: undefined,
  away_team_score: undefined,
  broadcast_channel: "",
};

const Admin = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"games" | "banners">("games");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<GameInsert>>(INITIAL_FORM);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSport, setFilterSport] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Banner state
  const [bannerCategory, setBannerCategory] = useState<BannerCategory | "all">("all");
  const [bannerUploadOpen, setBannerUploadOpen] = useState(false);
  const [bannerUploadCategory, setBannerUploadCategory] = useState<BannerCategory>("cover");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["admin-games"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: banners = [], isLoading: bannersLoading } = useBanners(
    bannerCategory === "all" ? "all" : bannerCategory,
    false
  );

  const uploadBanner = useUploadBanner();
  const toggleBanner = useToggleBanner();
  const deleteBanner = useDeleteBanner();

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      if (filterSport !== "all" && g.sport !== filterSport) return false;
      if (filterStatus !== "all" && g.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          g.home_team_name.toLowerCase().includes(q) ||
          g.away_team_name.toLowerCase().includes(q) ||
          g.league.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [games, filterSport, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayGames = games.filter((g) => g.start_time.startsWith(today));
    return {
      total: games.length,
      today: todayGames.length,
      live: games.filter((g) => g.status === "live").length,
      scheduled: games.filter((g) => g.status === "scheduled").length,
      finished: games.filter((g) => g.status === "finished").length,
    };
  }, [games]);

  const bannerCounts = useMemo(() => {
    const c: Record<string, number> = {};
    banners.forEach((b) => {
      if (b.active) c[b.category] = (c[b.category] || 0) + 1;
    });
    return c;
  }, [banners]);

  const upsertMutation = useMutation({
    mutationFn: async (game: Partial<GameInsert> & { id?: string }) => {
      if (game.id) {
        const { error } = await supabase.from("games").update(game).eq("id", game.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("games").insert(game as GameInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-games"] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
      toast.success(editingId ? "Jogo atualizado!" : "Jogo criado!");
      setFormOpen(false);
      setEditingId(null);
      setForm(INITIAL_FORM);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("games").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-games"] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
      toast.success("Jogo removido!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-lg text-destructive font-semibold">Acesso negado. Apenas administradores.</p>
        <Button variant="outline" onClick={() => signOut()}>Sair</Button>
      </div>
    );
  }

  const openEdit = (game: typeof games[0]) => {
    setEditingId(game.id);
    setForm({
      sport: game.sport,
      league: game.league,
      home_team_name: game.home_team_name,
      away_team_name: game.away_team_name,
      home_team_score: game.home_team_score,
      away_team_score: game.away_team_score,
      start_time: game.start_time ? game.start_time.slice(0, 16) : "",
      status: game.status,
      venue: game.venue || "",
      round: game.round || "",
      highlight: game.highlight,
      api_source: game.api_source || "manual",
      broadcast_channel: game.broadcast_channel || "",
    });
    setFormOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...form };
    if (payload.start_time && !payload.start_time.includes("+")) {
      payload.start_time = new Date(payload.start_time).toISOString();
    }
    if (editingId) payload.id = editingId;
    upsertMutation.mutate(payload);
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setBannerPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = async () => {
    if (!bannerFile) {
      toast.error("Selecione uma imagem.");
      return;
    }
    try {
      await uploadBanner.mutateAsync({
        file: bannerFile,
        category: bannerUploadCategory,
        title: bannerTitle || undefined,
      });
      toast.success("Banner enviado!");
      setBannerUploadOpen(false);
      setBannerFile(null);
      setBannerPreview(null);
      setBannerTitle("");
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
  };

  const sportIcon = (sport: string) => SPORTS.find((s) => s.type === sport)?.icon || "🏟️";
  const sportLabel = (sport: string) => SPORTS.find((s) => s.type === sport)?.label || sport;

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    live: { label: "Ao Vivo", color: "bg-[hsl(var(--live))]/15 text-[hsl(var(--live))] border-[hsl(var(--live))]/30", icon: <Wifi className="h-3 w-3" /> },
    scheduled: { label: "Agendado", color: "bg-primary/10 text-primary border-primary/20", icon: <Calendar className="h-3 w-3" /> },
    finished: { label: "Encerrado", color: "bg-muted text-muted-foreground border-border", icon: <Trophy className="h-3 w-3" /> },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Brito Solutions" className="h-9 w-auto" />
            <div>
              <h1 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                Painel Admin
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                  PRO
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Gerenciamento de programação esportiva
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Agenda</span>
              </Button>
            </a>
            <Button variant="outline" size="sm" onClick={signOut} className="text-muted-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 px-4 space-y-6">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-card p-1 w-fit">
          <button
            onClick={() => setActiveTab("games")}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "games"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Tv className="h-4 w-4" />
            Jogos
          </button>
          <button
            onClick={() => setActiveTab("banners")}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "banners"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Image className="h-4 w-4" />
            Banners
          </button>
        </div>

        {activeTab === "games" ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total de Jogos", value: stats.total, icon: <Tv className="h-5 w-5" />, color: "text-primary" },
                { label: "Hoje", value: stats.today, icon: <Calendar className="h-5 w-5" />, color: "text-[hsl(var(--info))]" },
                { label: "Ao Vivo", value: stats.live, icon: <Wifi className="h-5 w-5" />, color: "text-[hsl(var(--live))]" },
                { label: "Agendados", value: stats.scheduled, icon: <Zap className="h-5 w-5" />, color: "text-[hsl(var(--warning))]" },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border/50 bg-card p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                    <span className={stat.color}>{stat.icon}</span>
                  </div>
                  <p className="font-display text-2xl sm:text-3xl font-black text-foreground">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar time, liga..."
                  className="pl-9 bg-card border-border/50"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select value={filterSport} onValueChange={setFilterSport}>
                  <SelectTrigger className="w-[140px] bg-card border-border/50">
                    <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder="Esporte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Esportes</SelectItem>
                    {SPORTS.map((s) => (
                      <SelectItem key={s.type} value={s.type}>{s.icon} {s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[130px] bg-card border-border/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="live">Ao Vivo</SelectItem>
                    <SelectItem value="finished">Encerrado</SelectItem>
                  </SelectContent>
                </Select>

                <div className="hidden sm:flex items-center rounded-lg border border-border/50 bg-card p-0.5">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn("rounded-md p-1.5 transition-colors", viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn("rounded-md p-1.5 transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {filteredGames.length} de {games.length} jogos
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    toast.info("Sincronizando com APIs...");
                    try {
                      const { data, error } = await supabase.functions.invoke("sync-daily-games");
                      if (error) throw error;
                      toast.success(`Sync concluída! ${data?.total || 0} jogos importados.`);
                      queryClient.invalidateQueries({ queryKey: ["admin-games"] });
                      queryClient.invalidateQueries({ queryKey: ["games"] });
                    } catch (err: any) {
                      toast.error(`Erro na sync: ${err.message}`);
                    }
                  }}
                  className="border-primary/30 text-primary hover:bg-primary/10"
                >
                  <RefreshCw className="h-4 w-4" />
                  Sincronizar APIs
                </Button>
                <Dialog open={formOpen} onOpenChange={setFormOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={openCreate} className="gap-1.5">
                      <Plus className="h-4 w-4" />
                      Novo Jogo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto border-border/50 bg-card sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="font-display flex items-center gap-2">
                        {editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                        {editingId ? "Editar Jogo" : "Novo Jogo"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Esporte</Label>
                          <Select value={form.sport} onValueChange={(v: any) => setForm({ ...form, sport: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {SPORTS.map((s) => (
                                <SelectItem key={s.type} value={s.type}>{s.icon} {s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Status</Label>
                          <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">📅 Agendado</SelectItem>
                              <SelectItem value="live">🔴 Ao Vivo</SelectItem>
                              <SelectItem value="finished">✅ Encerrado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Liga / Campeonato</Label>
                        <Input value={form.league || ""} onChange={(e) => setForm({ ...form, league: e.target.value })} placeholder="Brasileirão Série A" required />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Time Casa</Label>
                          <Input value={form.home_team_name || ""} onChange={(e) => setForm({ ...form, home_team_name: e.target.value })} placeholder="Flamengo" required />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Time Visitante</Label>
                          <Input value={form.away_team_name || ""} onChange={(e) => setForm({ ...form, away_team_name: e.target.value })} placeholder="Palmeiras" required />
                        </div>
                      </div>

                      {form.status !== "scheduled" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Placar Casa</Label>
                            <Input type="number" min={0} value={form.home_team_score ?? ""} onChange={(e) => setForm({ ...form, home_team_score: e.target.value ? Number(e.target.value) : undefined })} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Placar Visitante</Label>
                            <Input type="number" min={0} value={form.away_team_score ?? ""} onChange={(e) => setForm({ ...form, away_team_score: e.target.value ? Number(e.target.value) : undefined })} />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Data e Hora</Label>
                        <Input type="datetime-local" value={form.start_time || ""} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Local</Label>
                          <Input value={form.venue || ""} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Maracanã" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Rodada / Fase</Label>
                          <Input value={form.round || ""} onChange={(e) => setForm({ ...form, round: e.target.value })} placeholder="Rodada 5" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Canal de Transmissão</Label>
                        <Input
                          value={(form as any).broadcast_channel || ""}
                          onChange={(e) => setForm({ ...form, broadcast_channel: e.target.value } as any)}
                          placeholder="Ex: Globo / SporTV"
                          list="channel-suggestions"
                        />
                        <datalist id="channel-suggestions">
                          {BROADCAST_CHANNELS.map((ch) => (<option key={ch} value={ch} />))}
                        </datalist>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-3">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-[hsl(var(--warning))]" />
                          <Label className="text-sm">Destaque do dia</Label>
                        </div>
                        <Switch checked={form.highlight || false} onCheckedChange={(v) => setForm({ ...form, highlight: v })} />
                      </div>

                      <Button type="submit" className="w-full" disabled={upsertMutation.isPending}>
                        {upsertMutation.isPending ? "Salvando..." : editingId ? "Atualizar Jogo" : "Criar Jogo"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Games */}
            {gamesLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredGames.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <Tv className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="font-display text-base font-semibold text-foreground">Nenhum jogo encontrado</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {games.length === 0 ? 'Clique em "Novo Jogo" para começar.' : "Tente ajustar os filtros."}
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {filteredGames.map((game) => {
                    const sc = statusConfig[game.status] || statusConfig.scheduled;
                    return (
                      <motion.div
                        key={game.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group relative rounded-xl border border-border/50 bg-card overflow-hidden hover:border-border transition-all"
                      >
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-secondary/30">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{sportIcon(game.sport)}</span>
                            <span className="text-[11px] font-medium text-muted-foreground">{game.league}</span>
                          </div>
                          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold", sc.color)}>
                            {sc.icon} {sc.label}
                          </span>
                        </div>

                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate">{game.home_team_name}</p>
                              <p className="text-xs text-muted-foreground truncate">vs</p>
                              <p className="font-semibold text-sm text-foreground truncate">{game.away_team_name}</p>
                            </div>
                            <div className="text-right shrink-0">
                              {game.status !== "scheduled" ? (
                                <p className="font-display text-2xl font-black text-foreground">
                                  {game.home_team_score ?? 0} - {game.away_team_score ?? 0}
                                </p>
                              ) : (
                                <p className="font-display text-xl font-bold text-primary">
                                  {format(new Date(game.start_time), "HH:mm")}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground">
                                {format(new Date(game.start_time), "dd/MM")}
                              </p>
                            </div>
                          </div>

                          {game.broadcast_channel && (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Tv className="h-3 w-3" />
                              <span>{game.broadcast_channel}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
                            {game.venue && <span>📍 {game.venue}</span>}
                            {game.round && <span>• {game.round}</span>}
                            {game.highlight && <span className="text-[hsl(var(--warning))]">⭐ Destaque</span>}
                            {game.api_source !== "manual" && (
                              <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 text-[9px] font-medium">
                                {game.api_source}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex border-t border-border/30">
                          <button
                            onClick={() => openEdit(game)}
                            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </button>
                          <div className="w-px bg-border/30" />
                          <button
                            onClick={() => { if (confirm("Remover este jogo?")) deleteMutation.mutate(game.id); }}
                            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remover
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredGames.map((game) => {
                    const sc = statusConfig[game.status] || statusConfig.scheduled;
                    return (
                      <motion.div
                        key={game.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 hover:border-border transition-all"
                      >
                        <span className="text-lg shrink-0">{sportIcon(game.sport)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {game.home_team_name} vs {game.away_team_name}
                            </p>
                            <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold shrink-0", sc.color)}>
                              {sc.icon} {sc.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            <span>{game.league}</span>
                            <span>•</span>
                            <span>{format(new Date(game.start_time), "dd/MM HH:mm")}</span>
                            {game.broadcast_channel && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1"><Tv className="h-3 w-3" />{game.broadcast_channel}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {game.status !== "scheduled" && (
                          <p className="font-display text-lg font-black text-foreground shrink-0">
                            {game.home_team_score ?? 0} - {game.away_team_score ?? 0}
                          </p>
                        )}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(game)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Remover este jogo?")) deleteMutation.mutate(game.id); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </>
        ) : (
          /* ==================== BANNERS TAB ==================== */
          <>
            {/* Banner Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
              <button
                onClick={() => setBannerCategory("all")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                  bannerCategory === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                Todos
              </button>
              {BANNER_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setBannerCategory(cat.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                    bannerCategory === cat.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                  {bannerCounts[cat.value] ? (
                    <span className="rounded-full bg-background/20 px-1.5 text-[10px]">
                      {bannerCounts[cat.value]}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {/* Upload Banner */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {banners.length} banner{banners.length !== 1 ? "s" : ""}
              </p>
              <Dialog open={bannerUploadOpen} onOpenChange={setBannerUploadOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <Upload className="h-4 w-4" />
                    Upload Banner
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-border/50 bg-card sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-display flex items-center gap-2">
                      <Image className="h-5 w-5 text-primary" />
                      Novo Banner
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Image upload area */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative cursor-pointer rounded-xl border-2 border-dashed border-border/50 bg-secondary/30 p-6 text-center hover:border-primary/50 transition-colors"
                    >
                      {bannerPreview ? (
                        <img
                          src={bannerPreview}
                          alt="Preview"
                          className="mx-auto max-h-48 rounded-lg object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">
                            Clique para selecionar imagem
                          </p>
                          <p className="text-xs text-muted-foreground/60">
                            JPG, PNG ou WebP
                          </p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBannerFileChange}
                        className="hidden"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Categoria</Label>
                      <Select
                        value={bannerUploadCategory}
                        onValueChange={(v) => setBannerUploadCategory(v as BannerCategory)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {BANNER_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.icon} {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Título (opcional)</Label>
                      <Input
                        value={bannerTitle}
                        onChange={(e) => setBannerTitle(e.target.value)}
                        placeholder="Ex: Jogos do Dia - 18/03"
                      />
                    </div>

                    <Button
                      onClick={handleBannerUpload}
                      disabled={!bannerFile || uploadBanner.isPending}
                      className="w-full"
                    >
                      {uploadBanner.isPending ? "Enviando..." : "Enviar Banner"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Banner Grid */}
            {bannersLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : banners.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <Image className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="font-display text-base font-semibold text-foreground">
                  Nenhum banner encontrado
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Clique em "Upload Banner" para adicionar.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {banners.map((banner) => {
                    const cat = BANNER_CATEGORIES.find((c) => c.value === banner.category);
                    return (
                      <motion.div
                        key={banner.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group rounded-xl border border-border/50 bg-card overflow-hidden hover:border-border transition-all"
                      >
                        {/* Image */}
                        <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
                          <img
                            src={banner.image_url}
                            alt={banner.title || cat?.label || "Banner"}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          {/* Overlay badge */}
                          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 backdrop-blur-sm">
                            <span className="text-xs">{cat?.icon}</span>
                            <span className="text-[10px] font-medium text-foreground">{cat?.label}</span>
                          </div>
                          {!banner.active && (
                            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                Inativo
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info & Actions */}
                        <div className="p-3 space-y-2">
                          {banner.title && (
                            <p className="text-sm font-medium text-foreground truncate">
                              {banner.title}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={banner.active}
                                onCheckedChange={(v) =>
                                  toggleBanner.mutate({ id: banner.id, active: v })
                                }
                              />
                              <span className="text-xs text-muted-foreground">
                                {banner.active ? "Ativo" : "Inativo"}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm("Remover este banner?"))
                                  deleteBanner.mutate(banner);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Admin;
