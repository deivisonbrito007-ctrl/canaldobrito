import { useState, useMemo, useEffect } from "react";
import { useTMDBSearch, type TMDBResult } from "@/hooks/useTMDB";
import { useAllNewsReleases, useAddNewsRelease, useToggleNewsRelease, useDeleteNewsRelease, useUpdateNewsRelease, type NewsRelease } from "@/hooks/useNewsReleases";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Plus, Trash2, Star, ImageOff, Loader2, Sparkles, ArrowUp, ArrowDown, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { NovidadesStatsBar } from "@/components/admin/NovidadesStatsBar";

const TMDB_IMG = "https://image.tmdb.org/t/p/w780";
const ratingColor = (r: number) => r >= 7 ? "text-emerald-400" : r >= 5 ? "text-amber-400" : "text-red-400";

type FilterMode = "all" | "movie" | "series" | "inactive" | "no_genre";
type SortMode = "manual" | "newest" | "oldest" | "title_asc" | "title_desc" | "rating_desc" | "rating_asc";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "manual", label: "Ordem manual" },
  { value: "newest", label: "Mais novos" },
  { value: "oldest", label: "Mais antigos" },
  { value: "title_asc", label: "Título (A-Z)" },
  { value: "title_desc", label: "Título (Z-A)" },
  { value: "rating_desc", label: "Nota (maior)" },
  { value: "rating_asc", label: "Nota (menor)" },
];

const BADGE_OPTIONS = [
  { value: "novidade", label: "🔥 Novidade" },
  { value: "lancamento", label: "🆕 Lançamento" },
  { value: "nova_temporada", label: "📺 Nova Temporada" },
  { value: "estreia", label: "⭐ Estreia" },
  { value: "exclusivo", label: "👑 Exclusivo" },
];

// Run async tasks in chunks of `concurrency`.
async function runInChunks<T>(arr: T[], concurrency: number, worker: (item: T, idx: number) => Promise<void>) {
  let i = 0;
  const runners = Array.from({ length: Math.min(concurrency, arr.length) }, async () => {
    while (i < arr.length) {
      const idx = i++;
      await worker(arr[idx], idx);
    }
  });
  await Promise.all(runners);
}

const AdminNovidades = () => {
  const { user } = useAuth();
  const { results, loading: searching, search, setResults, fetchDetails } = useTMDBSearch();
  const { data: items, isLoading } = useAllNewsReleases();
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
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    if (typeof window === "undefined") return "manual";
    return (localStorage.getItem("admin:novidadesSort") as SortMode) || "manual";
  });
  const [listSearch, setListSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<NewsRelease | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(listSearch.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [listSearch]);

  const handleBadgeTypeChange = (v: string) => {
    setBadgeType(v);
    try { localStorage.setItem("admin:lastBadgeType", v); } catch { /* ignore */ }
  };

  const handleSortChange = (v: SortMode) => {
    setSortMode(v);
    try { localStorage.setItem("admin:novidadesSort", v); } catch { /* ignore */ }
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
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (err?.code === "23505" || /duplicate|unique/i.test(msg)) {
        toast.info("Item já adicionado");
      } else {
        toast.error(msg);
      }
    }
    setAddingId(null);
  };

  const handleRefreshOne = async (item: NewsRelease) => {
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
        backdrop_url: backdropUrl || item.backdrop_url,
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
    let done = 0;
    await runInChunks(needsUpdate, 3, async (m) => {
      try {
        if (!m.tmdb_id) return;
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
      finally {
        done++;
        setBatchProgress({ current: done, total: needsUpdate.length });
      }
    });
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

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteItem.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const filteredItems = useMemo(() => {
    if (!items) return [];
    const filtered = items.filter((m) => {
      if (filter === "movie" && m.content_type !== "movie") return false;
      if (filter === "series" && m.content_type !== "series" && m.content_type !== "tv") return false;
      if (filter === "inactive" && m.active) return false;
      if (filter === "no_genre" && m.genres) return false;
      if (debouncedSearch) {
        const hay = `${m.title} ${m.genres || ""}`.toLowerCase();
        if (!hay.includes(debouncedSearch)) return false;
      }
      return true;
    });
    if (sortMode === "manual") return filtered;
    const sorted = [...filtered];
    const t = (s: string | null | undefined) => (s || "").toLocaleLowerCase("pt-BR");
    const d = (s: string | null | undefined) => (s ? new Date(s).getTime() : 0);
    switch (sortMode) {
      case "newest": sorted.sort((a, b) => d(b.created_at) - d(a.created_at)); break;
      case "oldest": sorted.sort((a, b) => d(a.created_at) - d(b.created_at)); break;
      case "title_asc": sorted.sort((a, b) => t(a.title).localeCompare(t(b.title), "pt-BR")); break;
      case "title_desc": sorted.sort((a, b) => t(b.title).localeCompare(t(a.title), "pt-BR")); break;
      case "rating_desc": sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1)); break;
      case "rating_asc": sorted.sort((a, b) => (a.rating ?? Infinity) - (b.rating ?? Infinity)); break;
    }
    return sorted;
  }, [items, filter, debouncedSearch, sortMode]);

  const missingGenreCount = items?.filter((m) => !m.genres).length || 0;

  const FilterChip = ({ value, label, count }: { value: FilterMode; label: string; count?: number }) => (
    <button
      type="button"
      onClick={() => setFilter(value)}
      className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors min-h-[32px] ${
        filter === value
          ? "bg-primary/20 border-primary/40 text-primary"
          : "border-white/[0.08] text-muted-foreground hover:text-foreground hover:border-white/[0.18]"
      }`}
    >
      {label}{typeof count === "number" && count > 0 ? ` · ${count}` : ""}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Stats */}
      {items && items.length > 0 && <NovidadesStatsBar items={items} />}

      {/* Search TMDB */}
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
                {BADGE_OPTIONS.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Input placeholder={searchType === "movie" ? "Nome do filme..." : "Nome da série..."} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="glass-panel border-white/[0.1] text-sm h-10" />
            <Button onClick={handleSearch} disabled={searching} size="icon" className="shrink-0 h-10 w-10" aria-label="Buscar">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {searching && <div className="flex items-center gap-2 text-xs text-muted-foreground py-2"><Loader2 className="h-4 w-4 animate-spin" />Buscando...</div>}

          {results.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {results.map((r) => {
                const already = items?.some((m) => m.tmdb_id === r.id && m.content_type === searchType);
                return (
                  <div key={r.id} className="relative rounded-lg glass-panel overflow-hidden group">
                    {r.poster_path ? (
                      <img src={`${TMDB_IMG}${r.poster_path}`} alt={r.title || r.name} className="w-full aspect-[2/3] object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full aspect-[2/3] flex items-center justify-center bg-white/[0.02]"><ImageOff className="h-6 w-6 text-muted-foreground/20" /></div>
                    )}
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                      <Star className={`h-2.5 w-2.5 fill-current ${ratingColor(r.vote_average || 0)}`} />
                      <span className="text-[10px] font-bold tabular-nums">{r.vote_average?.toFixed(1)}</span>
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-semibold truncate">{r.title || r.name}</p>
                    </div>
                    <Button
                      size="sm"
                      className="absolute bottom-1.5 right-1.5 h-7 px-2 rounded-full text-[10px] shadow-lg"
                      onClick={() => handleAdd(r)}
                      disabled={addingId === r.id || already}
                      aria-label={already ? "Já adicionado" : `Adicionar ${r.title || r.name}`}
                    >
                      {addingId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : already ? "✓" : <Plus className="h-3 w-3" />}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Items list */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-foreground">Adicionados</h3>
          {missingGenreCount > 0 && (
            <Button size="sm" variant="outline" onClick={handleBatchUpdate} disabled={!!batchProgress} className="h-8 text-[11px] gap-1.5">
              {batchProgress ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Atualizar {missingGenreCount} sem gênero</span>
              <span className="sm:hidden">Atualizar {missingGenreCount}</span>
            </Button>
          )}
        </div>

        {batchProgress && (
          <div className="px-4 pt-3 space-y-1">
            <p className="text-[11px] text-muted-foreground">Atualizando {batchProgress.current}/{batchProgress.total}...</p>
            <Progress value={(batchProgress.current / batchProgress.total) * 100} className="h-1.5" />
          </div>
        )}

        {/* Filters */}
        <div className="px-4 pt-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Buscar por título ou gênero..."
              className="pl-8 pr-8 h-9 text-xs glass-panel border-white/[0.08]"
              aria-label="Buscar nos itens adicionados"
            />
            {listSearch && (
              <button
                type="button"
                onClick={() => setListSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortMode} onValueChange={(v) => handleSortChange(v as SortMode)}>
              <SelectTrigger className="h-9 text-[11px] glass-panel border-white/[0.08] flex-1 sm:flex-none sm:w-44" aria-label="Ordenar por">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            <FilterChip value="all" label="Todos" count={items?.length} />
            <FilterChip value="movie" label="🎬 Filmes" count={items?.filter((i) => i.content_type === "movie").length} />
            <FilterChip value="series" label="📺 Séries" count={items?.filter((i) => i.content_type === "series" || i.content_type === "tv").length} />
            <FilterChip value="inactive" label="Inativos" count={items?.filter((i) => !i.active).length} />
            <FilterChip value="no_genre" label="Sem gênero" count={missingGenreCount} />
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg shimmer" />
              ))}
            </div>
          ) : !items || items.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <Sparkles className="h-8 w-8 text-muted-foreground/20 mx-auto" />
              <p className="text-xs text-muted-foreground">Nenhum item adicionado</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-muted-foreground">Nenhum item corresponde aos filtros</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((m) => {
                const idx = items.indexOf(m);
                return (
                  <div key={m.id} className="rounded-lg glass-panel p-3 transition-all duration-200 space-y-2">
                    {/* Top row: poster + info */}
                    <div className="flex items-start gap-3">
                      {m.image_url ? (
                        <img src={m.image_url} alt={m.title} className="h-16 w-12 rounded-md object-cover shrink-0" loading="lazy" />
                      ) : (
                        <div className="h-16 w-12 rounded-md bg-white/[0.03] flex items-center justify-center shrink-0"><ImageOff className="h-3.5 w-3.5 text-muted-foreground/20" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate leading-tight">{m.title}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`rounded px-1.5 py-0.5 font-bold text-white text-[10px] ${m.content_type === "movie" ? "bg-emerald-500/80" : "bg-blue-500/80"}`}>
                            {m.content_type === "movie" ? "🎬 Filme" : "📺 Série"}
                          </span>
                          <Select value={m.badge_type} onValueChange={(v) => updateItem.mutate({ id: m.id, badge_type: v })}>
                            <SelectTrigger className="h-7 w-auto min-w-[120px] text-[11px] font-bold border-white/[0.1] bg-white/[0.03] px-2 py-0 gap-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BADGE_OPTIONS.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          {m.year && <span className="text-[11px] text-muted-foreground/70">{m.year}</span>}
                          {m.rating != null && m.rating > 0 && (
                            <span className={`flex items-center gap-0.5 text-[11px] font-bold ${ratingColor(m.rating)}`}>
                              <Star className="h-2.5 w-2.5 fill-current" />
                              {m.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        {m.genres ? (
                          <p className="text-[11px] text-muted-foreground/60 mt-1 truncate">{m.genres}</p>
                        ) : (
                          <p className="text-[11px] text-amber-400/80 italic mt-1">sem gênero</p>
                        )}
                        {(m.runtime || m.seasons) && (
                          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                            {m.runtime ? `${Math.floor(m.runtime / 60)}h ${m.runtime % 60}min` : ""}
                            {m.runtime && m.seasons ? " · " : ""}
                            {m.seasons ? `${m.seasons} temporada${m.seasons > 1 ? "s" : ""}` : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom row: controls */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.04]">
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-md" disabled={idx === 0 || filter !== "all" || debouncedSearch !== ""} onClick={() => handleReorder(idx, "up")} aria-label={`Mover ${m.title} para cima`}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-md" disabled={idx === items.length - 1 || filter !== "all" || debouncedSearch !== ""} onClick={() => handleReorder(idx, "down")} aria-label={`Mover ${m.title} para baixo`}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-md text-muted-foreground hover:text-amber-400" disabled={refreshingId === m.id} onClick={() => handleRefreshOne(m)} aria-label={`Atualizar dados de ${m.title}`}>
                          <RefreshCw className={`h-4 w-4 ${refreshingId === m.id ? "animate-spin" : ""}`} />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer min-h-[36px] px-1">
                          <span className="text-[11px] text-muted-foreground">{m.active ? "Ativo" : "Inativo"}</span>
                          <Switch checked={m.active} onCheckedChange={(v) => toggleItem.mutate({ id: m.id, active: v })} aria-label={`${m.active ? "Desativar" : "Ativar"} ${m.title}`} />
                        </label>
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-md text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(m)} aria-label={`Remover ${m.title}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover item?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente "{deleteTarget?.title}" das novidades.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminNovidades;
