import { useState } from "react";
import { useTMDBSearch, type TMDBResult } from "@/hooks/useTMDB";
import { useAllMovies, useAddMovie, useToggleMovie, useDeleteMovie } from "@/hooks/useMovies";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, Trash2, Star, ImageOff, Loader2, Film } from "lucide-react";
import { toast } from "sonner";

const TMDB_IMG = "https://image.tmdb.org/t/p/w300";
const ratingColor = (r: number) => r >= 7 ? "text-emerald-400" : r >= 5 ? "text-amber-400" : "text-red-400";

const AdminFilmes = () => {
  const { user } = useAuth();
  const { results, loading: searching, search } = useTMDBSearch();
  const { data: movies } = useAllMovies();
  const addMovie = useAddMovie();
  const toggleMovie = useToggleMovie();
  const deleteMovie = useDeleteMovie();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"search" | "trending">("search");

  const handleSearch = () => { if (query.trim()) search("search_movie", query); };
  const loadNowPlaying = () => { setTab("trending"); search("now_playing"); };

  const handleAdd = async (r: TMDBResult) => {
    const existing = movies?.find((m) => m.tmdb_id === r.id);
    if (existing) { toast.info("Filme já adicionado"); return; }
    try {
      await addMovie.mutateAsync({
        tmdb_id: r.id, title: r.title || r.name || "",
        poster_url: r.poster_path ? `${TMDB_IMG}${r.poster_path}` : null,
        overview: r.overview || null,
        rating: r.vote_average ? Math.round(r.vote_average * 10) / 10 : null,
        year: r.release_date ? parseInt(r.release_date) : null,
        genre: null, added_by: user?.id || null,
      });
      toast.success("Filme adicionado!");
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Film className="h-4 w-4 text-blue-400" />
            Buscar Filmes
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-1.5">
            {[
              { key: "search" as const, label: "Buscar", onClick: () => setTab("search") },
              { key: "trending" as const, label: "Em cartaz", onClick: loadNowPlaying },
            ].map((t) => (
              <button key={t.key} onClick={t.onClick} className={`px-3 py-2 rounded-lg text-[11px] font-semibold transition-all min-h-[36px] ${tab === t.key ? "bg-blue-500/15 text-blue-400 border border-blue-500/30" : "glass-panel text-muted-foreground/70"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "search" && (
            <div className="flex gap-2">
              <Input placeholder="Nome do filme..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="glass-panel border-white/[0.1] text-sm h-10" />
              <Button onClick={handleSearch} disabled={searching} size="icon" className="shrink-0 h-10 w-10">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          )}

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

      {/* Added Movies as cards */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-foreground">Adicionados</h3>
          <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-0.5">{movies?.length || 0}</span>
        </div>
        <div className="p-4">
          {!movies || movies.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <Film className="h-8 w-8 text-muted-foreground/20 mx-auto" />
              <p className="text-xs text-muted-foreground">Nenhum filme adicionado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {movies.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg glass-panel p-3">
                  {m.poster_url ? (
                    <img src={m.poster_url} alt={m.title} className="h-12 w-9 rounded-md object-cover shrink-0" />
                  ) : (
                    <div className="h-12 w-9 rounded-md bg-white/[0.03] flex items-center justify-center shrink-0"><ImageOff className="h-3.5 w-3.5 text-muted-foreground/20" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{m.title}</p>
                    <p className="text-[9px] text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                      {m.year}
                      {m.rating && <><Star className={`h-2 w-2 fill-current ${ratingColor(m.rating)}`} /><span className={ratingColor(m.rating)}>{m.rating}</span></>}
                    </p>
                  </div>
                  <Switch checked={m.active} onCheckedChange={(v) => toggleMovie.mutate({ id: m.id, active: v })} />
                  <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10 shrink-0" onClick={() => { if (confirm("Remover filme?")) deleteMovie.mutate(m.id); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFilmes;
