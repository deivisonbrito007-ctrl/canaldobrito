import { useState } from "react";
import { format } from "date-fns";
import { useGamesByDate, useCreateGame, useUpdateGame, useDeleteGame, useClearDayGames, type Game, type GameInsert } from "@/hooks/useGames";
import { useDailyBanner, useUpsertDailyBanner, useToggleDailyBanner } from "@/hooks/useDailyBanner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Copy, Upload, ImageOff, Pencil, X, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const COMPETITIONS = ["Brasileirão", "Champions League", "Copa do Brasil", "Libertadores", "Premier League", "La Liga", "Serie A", "Copa América", "Mundial", "Outro"];

const AdminProgramacao = () => {
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: games, isLoading: gamesLoading } = useGamesByDate(today);
  const { data: banner } = useDailyBanner();
  const upsertBanner = useUpsertDailyBanner();
  const toggleBanner = useToggleDailyBanner();
  const createGame = useCreateGame();
  const updateGame = useUpdateGame();
  const deleteGame = useDeleteGame();
  const clearDay = useClearDayGames();

  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const emptyForm: GameInsert = { date: today, time: "16:00", home_team: "", away_team: "", home_logo: null, away_logo: null, competition: "Brasileirão", channel: "", active: true };
  const [form, setForm] = useState<GameInsert>(emptyForm);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `daily/${today}.${ext}`;
      const { error: upErr } = await supabase.storage.from("banners").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);
      await upsertBanner.mutateAsync({ imageUrl: publicUrl, date: today });
      toast.success("Banner atualizado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar banner");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveGame = async () => {
    if (!form.home_team || !form.away_team) {
      toast.error("Preencha os nomes dos times");
      return;
    }
    try {
      if (editingId) {
        await updateGame.mutateAsync({ id: editingId, ...form });
        setEditingId(null);
      } else {
        await createGame.mutateAsync(form);
      }
      setForm(emptyForm);
      setShowForm(false);
      toast.success(editingId ? "Jogo atualizado!" : "Jogo adicionado!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEdit = (game: Game) => {
    setForm({ date: game.date, time: game.time, home_team: game.home_team, away_team: game.away_team, home_logo: game.home_logo, away_logo: game.away_logo, competition: game.competition, channel: game.channel, active: game.active });
    setEditingId(game.id);
    setShowForm(true);
  };

  const handleDuplicate = (game: Game) => {
    setForm({ date: game.date, time: game.time, home_team: game.home_team, away_team: game.away_team, home_logo: game.home_logo, away_logo: game.away_logo, competition: game.competition, channel: game.channel, active: true });
    setEditingId(null);
    setShowForm(true);
  };

  const handleClearDay = async () => {
    if (!confirm("Limpar toda a programação do dia? Isso removerá todos os jogos e desativará o banner.")) return;
    try {
      await clearDay.mutateAsync(today);
      toast.success("Programação limpa!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner do Dia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Banner do Dia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {banner ? (
            <div className="space-y-3">
              <img src={banner.image_url} alt="Banner" className="w-full max-w-md rounded-lg border border-border/30" />
              <div className="flex items-center gap-3">
                <Switch checked={banner.active} onCheckedChange={(v) => toggleBanner.mutate({ id: banner.id, active: v })} />
                <span className="text-sm text-muted-foreground">{banner.active ? "Ativo" : "Inativo"}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageOff className="h-4 w-4" />
              Nenhum banner para hoje
            </div>
          )}
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
              <Upload className="h-3 w-3" />
              {uploading ? "Enviando..." : "Upload Banner"}
            </span>
          </label>
        </CardContent>
      </Card>

      {/* Jogos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Jogos do Dia</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); }}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
            </Button>
            {games && games.length > 0 && (
              <Button size="sm" variant="destructive" onClick={handleClearDay}>
                <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Limpar Dia
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Form */}
          {showForm && (
            <div className="rounded-lg border border-border/50 bg-secondary/30 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Horário" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                <select value={form.competition} onChange={(e) => setForm({ ...form, competition: e.target.value })} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {COMPETITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Time Casa" value={form.home_team} onChange={(e) => setForm({ ...form, home_team: e.target.value })} />
                <Input placeholder="Time Visitante" value={form.away_team} onChange={(e) => setForm({ ...form, away_team: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Logo Casa (URL)" value={form.home_logo || ""} onChange={(e) => setForm({ ...form, home_logo: e.target.value || null })} />
                <Input placeholder="Logo Visitante (URL)" value={form.away_logo || ""} onChange={(e) => setForm({ ...form, away_logo: e.target.value || null })} />
              </div>
              <Input placeholder="Canal de transmissão" value={form.channel || ""} onChange={(e) => setForm({ ...form, channel: e.target.value || null })} />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveGame}>
                  <Check className="h-3.5 w-3.5 mr-1" /> {editingId ? "Salvar" : "Adicionar"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>
                  <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* List */}
          {gamesLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !games || games.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum jogo adicionado</p>
          ) : (
            <div className="space-y-2">
              {games.map((game) => (
                <div key={game.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      <span className="text-primary font-bold">{game.time?.slice(0, 5)}</span> — {game.home_team} vs {game.away_team}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{game.competition} {game.channel ? `• ${game.channel}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Switch checked={game.active} onCheckedChange={(v) => updateGame.mutate({ id: game.id, active: v })} />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(game)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDuplicate(game)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Excluir jogo?")) deleteGame.mutate(game.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProgramacao;
