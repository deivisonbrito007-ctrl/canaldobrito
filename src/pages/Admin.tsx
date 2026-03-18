import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, Trash2, LogOut, ArrowLeft, RefreshCw } from "lucide-react";
import { LiveBadge } from "@/components/LiveBadge";
import { SPORTS } from "@/types/sports";
import logo from "@/assets/logo_brito_solutions_sem_fundo.png";
import type { TablesInsert } from "@/integrations/supabase/types";

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
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<GameInsert>>(INITIAL_FORM);

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

  const upsertMutation = useMutation({
    mutationFn: async (game: Partial<GameInsert> & { id?: string }) => {
      if (game.id) {
        const { error } = await supabase
          .from("games")
          .update(game)
          .eq("id", game.id);
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
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
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
      broadcast_channel: (game as any).broadcast_channel || "",
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

  const sportIcon = (sport: string) => SPORTS.find((s) => s.type === sport)?.icon || "🏟️";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Brito Solutions" className="h-8 w-auto" />
            <h1 className="font-display text-lg font-bold text-foreground">Painel Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <a href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Agenda
              </Button>
            </a>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{games.length} jogos cadastrados</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
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
            >
              <RefreshCw className="h-4 w-4" />
              Sincronizar APIs
            </Button>
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Novo Jogo
                </Button>
              </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-border/50 bg-card sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingId ? "Editar Jogo" : "Novo Jogo"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Esporte</Label>
                    <Select
                      value={form.sport}
                      onValueChange={(v: any) => setForm({ ...form, sport: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SPORTS.map((s) => (
                          <SelectItem key={s.type} value={s.type}>
                            {s.icon} {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v: any) => setForm({ ...form, status: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Agendado</SelectItem>
                        <SelectItem value="live">Ao Vivo</SelectItem>
                        <SelectItem value="finished">Encerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Liga / Campeonato</Label>
                  <Input
                    value={form.league || ""}
                    onChange={(e) => setForm({ ...form, league: e.target.value })}
                    placeholder="Brasileirão Série A"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Time Casa</Label>
                    <Input
                      value={form.home_team_name || ""}
                      onChange={(e) => setForm({ ...form, home_team_name: e.target.value })}
                      placeholder="Flamengo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time Visitante</Label>
                    <Input
                      value={form.away_team_name || ""}
                      onChange={(e) => setForm({ ...form, away_team_name: e.target.value })}
                      placeholder="Palmeiras"
                      required
                    />
                  </div>
                </div>

                {form.status !== "scheduled" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Placar Casa</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.home_team_score ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, home_team_score: e.target.value ? Number(e.target.value) : undefined })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Placar Visitante</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.away_team_score ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, away_team_score: e.target.value ? Number(e.target.value) : undefined })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Data e Hora</Label>
                  <Input
                    type="datetime-local"
                    value={form.start_time || ""}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Local</Label>
                    <Input
                      value={form.venue || ""}
                      onChange={(e) => setForm({ ...form, venue: e.target.value })}
                      placeholder="Maracanã"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rodada / Fase</Label>
                    <Input
                      value={form.round || ""}
                      onChange={(e) => setForm({ ...form, round: e.target.value })}
                      placeholder="Rodada 5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Canal de Transmissão</Label>
                  <Input
                    value={(form as any).broadcast_channel || ""}
                    onChange={(e) => setForm({ ...form, broadcast_channel: e.target.value } as any)}
                    placeholder="Ex: Globo / SporTV"
                    list="channel-suggestions"
                  />
                  <datalist id="channel-suggestions">
                    {BROADCAST_CHANNELS.map((ch) => (
                      <option key={ch} value={ch} />
                    ))}
                  </datalist>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.highlight || false}
                    onCheckedChange={(v) => setForm({ ...form, highlight: v })}
                  />
                  <Label>Destaque do dia</Label>
                </div>

                <Button type="submit" className="w-full" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending
                    ? "Salvando..."
                    : editingId
                    ? "Atualizar Jogo"
                    : "Criar Jogo"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Table */}
        {gamesLoading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Esporte</TableHead>
                  <TableHead>Liga</TableHead>
                  <TableHead>Jogo</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell>{sportIcon(game.sport)}</TableCell>
                    <TableCell className="text-sm">{game.league}</TableCell>
                    <TableCell className="font-medium">
                      {game.home_team_name}
                      {game.home_team_score != null && ` ${game.home_team_score}`}
                      {" × "}
                      {game.away_team_score != null && `${game.away_team_score} `}
                      {game.away_team_name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(game.start_time), "dd/MM HH:mm")}
                    </TableCell>
                    <TableCell>
                      {game.status === "live" ? (
                        <LiveBadge />
                      ) : game.status === "finished" ? (
                        <span className="text-xs text-muted-foreground">Encerrado</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Agendado</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(game)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Remover este jogo?")) {
                              deleteMutation.mutate(game.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {games.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      Nenhum jogo cadastrado. Clique em "Novo Jogo" para começar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
