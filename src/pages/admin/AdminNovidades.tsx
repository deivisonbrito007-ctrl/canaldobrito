import { useState } from "react";
import { useTMDBSearch, type TMDBResult } from "@/hooks/useTMDB";
import { useAllNewsReleases, useAddNewsRelease, useToggleNewsRelease, useDeleteNewsRelease, useUpdateNewsRelease } from "@/hooks/useNewsReleases";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Trash2, Star, ImageOff, Loader2, Sparkles, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const TMDB_IMG = "https://image.tmdb.org/t/p/w780";
const ratingColor = (r: number) => r >= 7 ? "text-emerald-400" : r >= 5 ? "text-amber-400" : "text-red-400";

const AdminNovidades = () => {
  const { user } = useAuth();
  const { results, loading: searching, search, setResults, fetchDetails } = useTMDBSearch();
  const { data: items } = useAllNewsReleases();
  const addItem = useAddNewsRelease();
  const toggleItem = useToggleNewsRelease();
  const updateItem = useUpdateNewsRelease();
  const deleteItem = useDeleteNewsRelease();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"movie" | "series">("movie");
  const [badgeType, setBadgeType] = useState<string>(() => {
    if (typeof window === "undefined") return "novidade";
    return localStorage.getItem("admin:lastBadgeType") || "novidade";
  });
  const [addingId, setAddingId] = useState<number | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  const handleBadgeTypeChange = (v: string) => {
    setBadgeType(v);
    try { localStorage.setItem("admin:lastBadgeType", v); } catch { /* ignore */ }
  };

  const handleSearch = () => {
    if (query.trim()) search(searchType === "movie" ? "search_movie" : "search_tv", query);
  };

  const handleAdd = async (r: TMDBResult) => {
    const existing = items?.find((m) => m.tmdb_id === r.id && m.content_type === searchType);
    if (existing) { toast.info("Item já adicionado"); return; }
    setAddingId(r.id);
    try {
      const action = searchType === "movie" ? "movie_details" : "tv_details";
      const details = await fetchDetails(action, r.id);
      const genreText = details?.genres?.map((g) => g.name).join(", ") || null;
      const backdropUrl = (details as any)?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${(details as any).backdrop_path}` : null;
      await addItem.mutateAsync({
        tmdb_id: r.id, title: r.title || r.name || "",
        content_type: searchType, badge_type: badgeType,
        image_url: r.poster_path ? `${TMDB_IMG}${r.poster_path}` : null,
        backdrop_url: backdropUrl,
        overview: r.overview || null,
        rating: r.vote_average ? Math.round(r.vote_average * 10) / 10 : null,
        year: (r.release_date || r.first_air_date) ? parseInt(r.release_date || r.first_air_date || "") : null,
        display_order: items?.length ?? 0,
        added_by: user?.id || null,
        genres: genreText,
        runtime: searchType === "movie" ? ((details as any)?.runtime || null) : null,
        seasons: searchType === "series" ? ((details as any)?.number_of_seasons || null) : null,
        tagline: (details as any)?.tagline || null,
      });
      toast.success("Item adicionado com detalhes!");
    } catch (err: any) { toast.error(err.message); }
    setAddingId(null);
  };

  const handleRefreshOne = async (item: NonNullable<typeof items>[number]) => {
    if (!item.tmdb_id) return;
    setRefreshingId(item.id);
    try {
      const action = item.content_type === "movie" ? "movie_details" : "tv_details";
      const details = await fetchDetails(action as "movie_details" | "tv_details", item.tmdb_id);
      if (!details) { toast.error("Não foi possível buscar detalhes"); return; }
      const genreText = details.genres?.map((g) => g.name).join(", ") || null;
      const backdropUrl = (details as any)?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${(details as any).backdrop_path}` : null;
      await updateItem.mutateAsync({
        id: item.id,
        genres: genreText,
        rating: (details as any).vote_average ? Math.round((details as any).vote_average * 10) / 10 : item.rating,
        overview: (details as any).overview || item.overview,
        runtime: item.content_type === "movie" ? ((details as any).runtime || item.runtime) : item.runtime,
        seasons: item.content_type === "series" ? ((details as any).number_of_seasons || item.seasons) : item.seasons,
        tagline: (details as any).tagline || item.tagline,
        backdrop_url: backdropUrl || (item as any).backdrop_url,
      });
      toast.success(`"${item.title}" atualizado!`);
    } catch (err: any) { toast.error(err.message); }
    finally { setRefreshingId(null); }
  };

  const handleBatchUpdate = async () => {
    if (!items || items.length === 0) return;
    const needsUpdate = items.filter((m) => !m.genres);
    if (needsUpdate.length === 0) { toast.info("Todos os itens já têm gênero"); return; }
    setBatchProgress({ current: 0, total: needsUpdate.length });
    let updated = 0;
    for (let i = 0; i < needsUpdate.length; i++) {
      const m = needsUpdate[i];
      setBatchProgress({ current: i + 1, total: needsUpdate.length });
      try {
        if (!m.tmdb_id) continue;
        const action = m.content_type === "movie" ? "movie_details" : "tv_details";
        const details = await fetchDetails(action as "movie_details" | "tv_details", m.tmdb_id);
        if (details) {
          const genreText = details.genres?.map((g) => g.name).join(", ") || null;
          await updateItem.mutateAsync({
            id: m.id,
            genres: genreText,
            rating: (details as any).vote_average ? Math.round((details as any).vote_average * 10) / 10 : m.rating,
            overview: (details as any).overview || m.overview,
          });
          updated++;
        }
      } catch { /* continue */ }
    }
    setBatchProgress(null);
    toast.success(`${updated} de ${needsUpdate.length} itens atualizados!`);
  };

  const handleReorder = async (index: number, direction: "up" | "down") => {
    if (!items) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= items.length) return;
    const a = items[index];
    const b = items[swapIndex];
    try {
      await Promise.all([
        updateItem.mutateAsync({ id: a.id, display_order: b.display_order }),
        updateItem.mutateAsync({ id: b.id, display_order: a.display_order }),
      ]);
      toast.success("Ordem atualizada!");
    } catch (err: any) { toast.error(err.message); }
  };

  const activeCount = items?.filter((m) => m.active).length || 0;
  const totalCount = items?.length || 0;
  const missingGenreCount = items?.filter((m) => !m.genres).length || 0;

  return (
    <div className="space-y-5">
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Buscar Conteúdo
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Select value={searchType} onValueChange={(v) => { setSearchType(v as any); setResults([]); }}>
              <SelectTrigger className="glass-panel border-white/[0.1] h-10 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="movie">🎬 Filme</SelectItem>
                <SelectItem value="series">📺 Série</SelectItem>
              </SelectContent>
            </Select>
            <Select value={badgeType} onValueChange={handleBadgeTypeChange}>
              <SelectTrigger className="glass-panel border-white/[0.1] h-10 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="novidade">🔥 Novidade</SelectItem>
                <SelectItem value="lancamento">🆕 Lançamento</SelectItem>
                <SelectItem value="nova_temporada">📺 Nova Temporada</SelectItem>
                <SelectItem value="estreia">⭐ Estreia</SelectItem>
                <SelectItem value="exclusivo">👑 Exclusivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Input placeholder={searchType === "movie" ? "Nome do filme..." : "Nome da série..."} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="glass-panel border-white/[0.1] text-sm h-10" />
            <Button onClick={handleSearch} disabled={searching} size="icon" className="shrink-0 h-10 w-10">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {searching && <div className="flex items-center gap-2 text-xs text-muted-foreground py-2"><Loader2 className="h-4 w-4 animate-spin" />Buscando...</div>}

          {results.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {results.map((r) => (
                <div key={r.id} className="relative rounded-lg glass-panel overflow-hidden group">
                  {r.poster_path ? (
                    <img src={`${TMDB_IMG}${r.poster_path}`} alt={r.title || r.name} className="w-full aspect-[2/3] object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-[2/3] flex items-center justify-center bg-white/[0.02]"><ImageOff className="h-6 w-6 text-muted-foreground/20" /></div>
                  )}
                  <div className="p-2">
                    <p className="text-[10px] font-semibold truncate">{r.title || r.name}</p>
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
                      <Star className={`h-2 w-2 fill-current ${ratingColor(r.vote_average || 0)}`} />
                      <span>{r.vote_average?.toFixed(1)}</span>
                    </div>
                  </div>
                  <Button size="sm" className="absolute bottom-0 left-0 right-0 rounded-none h-8 text-[10px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 transition-opacity" onClick={() => handleAdd(r)} disabled={addingId === r.id}>
                    {addingId === r.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />} Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-foreground">Adicionados</h3>
          <div className="flex items-center gap-2">
            {missingGenreCount > 0 && (
              <Button size="sm" variant="outline" onClick={handleBatchUpdate} disabled={!!batchProgress} className="h-7 text-[10px] gap-1">
                {batchProgress ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Atualizar {missingGenreCount} sem gênero
              </Button>
            )}
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5">
              {activeCount} ativos / {totalCount}
            </span>
          </div>
        </div>

        {batchProgress && (
          <div className="px-4 pt-3 space-y-1">
            <p className="text-[10px] text-muted-foreground">Atualizando {batchProgress.current}/{batchProgress.total}...</p>
            <Progress value={(batchProgress.current / batchProgress.total) * 100} className="h-1.5" />
          </div>
        )}

        <div className="p-4">
          {!items || items.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <Sparkles className="h-8 w-8 text-muted-foreground/20 mx-auto" />
              <p className="text-xs text-muted-foreground">Nenhum item adicionado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((m, idx) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg glass-panel p-3 transition-all duration-200">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded" disabled={idx === 0} onClick={() => handleReorder(idx, "up")} aria-label={`Mover ${m.title} para cima`}>
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded" disabled={idx === items.length - 1} onClick={() => handleReorder(idx, "down")} aria-label={`Mover ${m.title} para baixo`}>
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>

                  {m.image_url ? (
                    <img src={m.image_url} alt={m.title} className="h-12 w-9 rounded-md object-cover shrink-0" />
                  ) : (
                    <div className="h-12 w-9 rounded-md bg-white/[0.03] flex items-center justify-center shrink-0"><ImageOff className="h-3.5 w-3.5 text-muted-foreground/20" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{m.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`rounded px-1.5 py-0.5 font-bold text-white text-[9px] ${m.content_type === "movie" ? "bg-emerald-500/80" : "bg-blue-500/80"}`}>
                        {m.content_type === "movie" ? "🎬 Filme" : "📺 Série"}
                      </span>
                      <Select value={m.badge_type} onValueChange={(v) => updateItem.mutate({ id: m.id, badge_type: v })}>
                        <SelectTrigger className="h-6 w-auto min-w-[110px] text-[9px] font-bold border-white/[0.1] bg-white/[0.03] px-2 py-0 gap-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novidade">🔥 Novidade</SelectItem>
                          <SelectItem value="lancamento">🆕 Lançamento</SelectItem>
                          <SelectItem value="nova_temporada">📺 Nova Temporada</SelectItem>
                          <SelectItem value="estreia">⭐ Estreia</SelectItem>
                          <SelectItem value="exclusivo">👑 Exclusivo</SelectItem>
                        </SelectContent>
                      </Select>
                      {m.year && <span className="text-[9px] text-muted-foreground/60">{m.year}</span>}
                    </div>
                    {m.genres ? (
                      <p className="text-[9px] text-muted-foreground/50 mt-0.5 truncate">{m.genres}</p>
                    ) : (
                      <p className="text-[9px] text-amber-400/70 italic mt-0.5">sem gênero</p>
                    )}
                    {m.runtime && <span className="text-[9px] text-muted-foreground/40">{Math.floor(m.runtime / 60)}h {m.runtime % 60}min</span>}
                    {m.seasons && <span className="text-[9px] text-muted-foreground/40">{m.seasons} temporada{m.seasons > 1 ? "s" : ""}</span>}
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-amber-400 shrink-0 transition-all duration-200" disabled={refreshingId === m.id} onClick={() => handleRefreshOne(m)} aria-label={`Atualizar dados de ${m.title}`}>
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshingId === m.id ? "animate-spin" : ""}`} />
                  </Button>
                  <Switch checked={m.active} onCheckedChange={(v) => { console.log("[AdminNovidades:toggle]", { id: m.id, active: v }); toggleItem.mutate({ id: m.id, active: v }); }} aria-label={`${m.active ? "Desativar" : "Ativar"} ${m.title}`} />
                  <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10 shrink-0 transition-all duration-200" onClick={() => { if (confirm("Remover item?")) { console.log("[AdminNovidades:delete]", { id: m.id, title: m.title }); deleteItem.mutate(m.id); } }} aria-label={`Remover ${m.title}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNovidades;
