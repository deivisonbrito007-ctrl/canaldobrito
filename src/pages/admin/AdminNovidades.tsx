import { useState } from "react";
import { useTMDBSearch, type TMDBResult } from "@/hooks/useTMDB";
import { useAllNewsReleases, useAddNewsRelease, useToggleNewsRelease, useDeleteNewsRelease } from "@/hooks/useNewsReleases";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Trash2, Star, ImageOff, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const TMDB_IMG = "https://image.tmdb.org/t/p/w300";
const ratingColor = (r: number) => r >= 7 ? "text-emerald-400" : r >= 5 ? "text-amber-400" : "text-red-400";

const AdminNovidades = () => {
  const { user } = useAuth();
  const { results, loading: searching, search, setResults } = useTMDBSearch();
  const { data: items } = useAllNewsReleases();
  const addItem = useAddNewsRelease();
  const toggleItem = useToggleNewsRelease();
  const deleteItem = useDeleteNewsRelease();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"movie" | "series">("movie");
  const [badgeType, setBadgeType] = useState<"novidade" | "lancamento">("novidade");

  const handleSearch = () => {
    if (query.trim()) search(searchType === "movie" ? "search_movie" : "search_tv", query);
  };

  const handleAdd = async (r: TMDBResult) => {
    const existing = items?.find((m) => m.tmdb_id === r.id && m.content_type === searchType);
    if (existing) { toast.info("Item já adicionado"); return; }
    try {
      await addItem.mutateAsync({
        tmdb_id: r.id, title: r.title || r.name || "",
        content_type: searchType, badge_type: badgeType,
        image_url: r.poster_path ? `${TMDB_IMG}${r.poster_path}` : null,
        overview: r.overview || null,
        rating: r.vote_average ? Math.round(r.vote_average * 10) / 10 : null,
        year: (r.release_date || r.first_air_date) ? parseInt(r.release_date || r.first_air_date || "") : null,
        display_order: items?.length ?? 0,
        added_by: user?.id || null,
      });
      toast.success("Item adicionado!");
    } catch (err: any) { toast.error(err.message); }
  };

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
          {/* Filters - stacked on mobile */}
          <div className="grid grid-cols-2 gap-2">
            <Select value={searchType} onValueChange={(v) => { setSearchType(v as any); setResults([]); }}>
              <SelectTrigger className="glass-panel border-white/[0.1] h-10 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="movie">🎬 Filme</SelectItem>
                <SelectItem value="series">📺 Série</SelectItem>
              </SelectContent>
            </Select>
            <Select value={badgeType} onValueChange={(v) => setBadgeType(v as any)}>
              <SelectTrigger className="glass-panel border-white/[0.1] h-10 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="novidade">🔥 Novidade</SelectItem>
                <SelectItem value="lancamento">🆕 Lançamento</SelectItem>
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
                <div key={r.id} className="relative rounded-lg glass-panel overflow-hidden">
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
                  <Button size="sm" className="absolute bottom-0 left-0 right-0 rounded-none h-8 text-[10px] opacity-0 hover:opacity-100 focus:opacity-100 active:opacity-100 transition-opacity" onClick={() => handleAdd(r)}>
                    <Plus className="h-3 w-3 mr-1" /> Add
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
          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5">{items?.length || 0}</span>
        </div>
        <div className="p-4">
          {!items || items.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <Sparkles className="h-8 w-8 text-muted-foreground/20 mx-auto" />
              <p className="text-xs text-muted-foreground">Nenhum item adicionado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg glass-panel p-3">
                  {m.image_url ? (
                    <img src={m.image_url} alt={m.title} className="h-12 w-9 rounded-md object-cover shrink-0" />
                  ) : (
                    <div className="h-12 w-9 rounded-md bg-white/[0.03] flex items-center justify-center shrink-0"><ImageOff className="h-3.5 w-3.5 text-muted-foreground/20" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{m.title}</p>
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground/60 mt-0.5 flex-wrap">
                      <span className={`rounded px-1 py-0.5 font-bold text-white text-[8px] ${m.content_type === "movie" ? "bg-emerald-500/80" : "bg-blue-500/80"}`}>
                        {m.content_type === "movie" ? "Filme" : "Série"}
                      </span>
                      <span className={`rounded px-1 py-0.5 font-bold text-white text-[8px] ${m.badge_type === "lancamento" ? "bg-purple-500/80" : "bg-orange-500/80"}`}>
                        {m.badge_type === "lancamento" ? "Lanç." : "Nov."}
                      </span>
                      {m.year && <span>{m.year}</span>}
                    </div>
                  </div>
                  <Switch checked={m.active} onCheckedChange={(v) => toggleItem.mutate({ id: m.id, active: v })} />
                  <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10 shrink-0" onClick={() => { if (confirm("Remover item?")) deleteItem.mutate(m.id); }}><Trash2 className="h-4 w-4" /></Button>
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
