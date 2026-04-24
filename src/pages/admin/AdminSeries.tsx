import { useState } from "react";
import { useTMDBSearch, type TMDBResult } from "@/hooks/useTMDB";
import { useAllSeries, useAddSeries, useToggleSeries, useDeleteSeries, useUpdateSeries } from "@/hooks/useSeries";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Search, Plus, Trash2, Star, ImageOff, Loader2, Clapperboard, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const TMDB_IMG = "https://image.tmdb.org/t/p/w300";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w780";
const ratingColor = (r: number) => r >= 7 ? "text-emerald-400" : r >= 5 ? "text-amber-400" : "text-red-400";

const AdminSeries = () => {
  const { user } = useAuth();
  const { results, loading: searching, search, setResults, fetchDetails } = useTMDBSearch();
  const { data: series } = useAllSeries();
  const addSeries = useAddSeries();
  const toggleSeries = useToggleSeries();
  const deleteSeries = useDeleteSeries();
  const updateSeries = useUpdateSeries();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"search" | "popular">("search");
  const [addingId, setAddingId] = useState<number | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  const handleSearch = () => { if (query.trim()) search("search_tv", query); };
  const loadPopular = () => { setTab("popular"); setResults([]); search("popular_tv"); };
  const switchToSearch = () => { setTab("search"); setResults([]); };

  const handleAdd = async (r: TMDBResult) => {
    const existing = series?.find((s) => s.tmdb_id === r.id);
    if (existing) { toast.info("Série já adicionada"); return; }
    setAddingId(r.id);
    try {
      const details = await fetchDetails("tv_details", r.id);
      const genreText = details?.genres?.map((g) => g.name).join(", ") || null;

      await addSeries.mutateAsync({
        tmdb_id: r.id, title: r.name || r.title || "",
        poster_url: r.poster_path ? `${TMDB_IMG}${r.poster_path}` : null,
        backdrop_url: (r as any).backdrop_path ? `${TMDB_BACKDROP}${(r as any).backdrop_path}` : null,
        overview: r.overview || null,
        rating: r.vote_average ? Math.round(r.vote_average * 10) / 10 : null,
        year: r.first_air_date ? parseInt(r.first_air_date) : null,
        genre: genreText, added_by: user?.id || null,
      });
      toast.success("Série adicionada!");
    } catch (err: any) { toast.error(err.message); }
    finally { setAddingId(null); }
  };

  const handleRefreshOne = async (s: NonNullable<typeof series>[number]) => {
    setRefreshingId(s.id);
    try {
      const details = await fetchDetails("tv_details", s.tmdb_id);
      if (!details) { toast.error("Não foi possível buscar detalhes"); return; }
      const genreText = details.genres?.map((g) => g.name).join(", ") || null;
      await updateSeries.mutateAsync({
        id: s.id,
        genre: genreText,
        rating: (details as any).vote_average ? Math.round((details as any).vote_average * 10) / 10 : s.rating,
        overview: (details as any).overview || s.overview,
        backdrop_url: (details as any).backdrop_path ? `${TMDB_BACKDROP}${(details as any).backdrop_path}` : s.backdrop_url,
      });
      toast.success(`"${s.title}" atualizado!`);
    } catch (err: any) { toast.error(err.message); }
    finally { setRefreshingId(null); }
  };

  const runBatch = async (list: NonNullable<typeof series>, label: string) => {
    setBatchProgress({ current: 0, total: list.length });
    let updated = 0;
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      setBatchProgress({ current: i + 1, total: list.length });
      try {
        const details = await fetchDetails("tv_details", s.tmdb_id);
        if (details) {
          const genreText = details.genres?.map((g) => g.name).join(", ") || null;
          await updateSeries.mutateAsync({
            id: s.id,
            genre: genreText,
            rating: (details as any).vote_average ? Math.round((details as any).vote_average * 10) / 10 : s.rating,
            overview: (details as any).overview || s.overview,
            backdrop_url: (details as any).backdrop_path ? `${TMDB_BACKDROP}${(details as any).backdrop_path}` : s.backdrop_url,
          });
          updated++;
        }
      } catch { /* continue */ }
    }
    setBatchProgress(null);
    toast.success(`${updated} de ${list.length} ${label} atualizadas!`);
  };

  const handleBatchUpdate = async () => {
    if (!series || series.length === 0) return;
    const needsUpdate = series.filter((s) => !s.genre || !s.backdrop_url);
    if (needsUpdate.length === 0) { toast.info("Todas as séries já estão completas"); return; }
    await runBatch(needsUpdate, "séries incompletas");
  };

  const handleBatchUpdateAll = async () => {
    if (!series || series.length === 0) return;
    await runBatch(series, "séries");
  };

  const activeCount = series?.filter((s) => s.active).length || 0;
  const totalCount = series?.length || 0;
  const missingDataCount = series?.filter((s) => !s.genre || !s.backdrop_url).length || 0;

  return (
    <div className="space-y-5">
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Clapperboard className="h-4 w-4 text-purple-400" />
            Buscar Séries
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-1.5">
            {[
              { key: "search" as const, label: "Buscar", onClick: switchToSearch },
              { key: "popular" as const, label: "Populares", onClick: loadPopular },
            ].map((t) => (
              <button key={t.key} onClick={t.onClick} className={`px-3 py-2 rounded-lg text-[11px] font-semibold transition-all min-h-[36px] ${tab === t.key ? "bg-purple-500/15 text-purple-400 border border-purple-500/30" : "glass-panel text-muted-foreground/70"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "search" ? (
            <div className="flex gap-2">
              <Input placeholder="Nome da série..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="glass-panel border-white/[0.1] text-sm h-10" aria-label="Buscar série por nome" />
              <Button onClick={handleSearch} disabled={searching} size="icon" className="shrink-0 h-10 w-10" aria-label="Buscar">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground/60 italic px-1">Mostrando séries populares no momento — clique em "Buscar" para voltar.</p>
          )}

          {searching && <div className="flex items-center gap-2 text-xs text-muted-foreground py-2"><Loader2 className="h-4 w-4 animate-spin" />Buscando...</div>}

          {results.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {results.map((r) => (
                <div key={r.id} className="relative rounded-lg glass-panel overflow-hidden group">
                  {r.poster_path ? (
                    <img src={`${TMDB_IMG}${r.poster_path}`} alt={r.name || r.title} className="w-full aspect-[2/3] object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-[2/3] flex items-center justify-center bg-white/[0.02]"><ImageOff className="h-6 w-6 text-muted-foreground/20" /></div>
                  )}
                  <div className="p-2">
                    <p className="text-[10px] font-semibold truncate">{r.name || r.title}</p>
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
                      <Star className={`h-2 w-2 fill-current ${ratingColor(r.vote_average || 0)}`} />
                      <span>{r.vote_average?.toFixed(1)}</span>
                    </div>
                  </div>
                  <Button size="sm" disabled={addingId === r.id} className="absolute bottom-0 left-0 right-0 rounded-none h-8 text-[10px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 transition-opacity" onClick={() => handleAdd(r)} aria-label={`Adicionar ${r.name || r.title} ao catálogo`}>
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
          <h3 className="text-sm font-bold text-foreground">Adicionadas</h3>
          <div className="flex items-center gap-2">
            {missingDataCount > 0 && (
              <Button size="sm" variant="outline" onClick={handleBatchUpdate} disabled={!!batchProgress} className="h-7 text-[10px] gap-1">
                {batchProgress ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Atualizar {missingDataCount} incompletas
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleBatchUpdateAll} disabled={!!batchProgress} className="h-7 text-[10px] gap-1">
              {batchProgress ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Atualizar Todas
            </Button>
            <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full px-2.5 py-0.5">
              {activeCount} ativas / {totalCount}
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
          {!series || series.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <Clapperboard className="h-8 w-8 text-muted-foreground/20 mx-auto" />
              <p className="text-xs text-muted-foreground">Nenhuma série adicionada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {series.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg glass-panel p-3">
                  {s.poster_url ? (
                    <img src={s.poster_url} alt={s.title} className="h-12 w-9 rounded-md object-cover shrink-0" />
                  ) : (
                    <div className="h-12 w-9 rounded-md bg-white/[0.03] flex items-center justify-center shrink-0"><ImageOff className="h-3.5 w-3.5 text-muted-foreground/20" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{s.title}</p>
                    <p className="text-[9px] text-muted-foreground/60 mt-0.5 flex items-center gap-1 flex-wrap">
                      {s.year && <span>{s.year}</span>}
                      {s.rating != null && <><Star className={`h-2 w-2 fill-current ${ratingColor(s.rating)}`} /><span className={ratingColor(s.rating)}>{s.rating}</span></>}
                      {s.genre ? <span className="text-purple-400/70">• {s.genre}</span> : <span className="text-amber-400/70 italic">• sem gênero</span>}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-purple-400 shrink-0 transition-all duration-200" disabled={refreshingId === s.id} onClick={() => handleRefreshOne(s)} aria-label={`Atualizar dados de ${s.title} via TMDB`}>
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshingId === s.id ? "animate-spin" : ""}`} />
                  </Button>
                  <Switch checked={s.active} onCheckedChange={(v) => { console.log("[AdminSeries:toggle]", { id: s.id, active: v }); toggleSeries.mutate({ id: s.id, active: v }); }} aria-label={`${s.active ? "Desativar" : "Ativar"} ${s.title}`} />
                  <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10 shrink-0 transition-all duration-200" onClick={() => { if (confirm("Remover série?")) { console.log("[AdminSeries:delete]", { id: s.id, title: s.title }); deleteSeries.mutate(s.id); } }} aria-label={`Remover ${s.title}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSeries;
