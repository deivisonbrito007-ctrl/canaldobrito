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
    <div className="space-y-6">
      {/* Search */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-white/[0.06]">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Film className="h-4 w-4 text-blue-400" />
            Buscar Filmes (TMDB)
          </h3>
        </div>
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex gap-2">
            {[
              { key: "search" as const, label: "Buscar", onClick: () => setTab("search") },
              { key: "trending" as const, label: "Lançamentos", onClick: loadNowPlaying },
            ].map((t) => (
              <button key={t.key} onClick={t.onClick} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${tab === t.key ? "bg-blue-500/15 text-blue-400 border border-blue-500/30" : "glass-panel text-muted-foreground/70 hover:text-foreground"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "search" && (
            <div className="flex gap-2">
              <Input placeholder="Nome do filme..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="glass-panel border-white/[0.1] text-sm" />
              <Button onClick={handleSearch} disabled={searching} size="icon" className="shrink-0">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {searching && <div className="flex items-center gap-2 text-sm text-muted-foreground py-2"><Loader2 className="h-4 w-4 animate-spin" />Buscando...</div>}

          {results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {results.map((r) => (
                <div key={r.id} className="group relative rounded-xl glass-panel glass-panel-hover overflow-hidden">
                  {r.poster_path ? (
                    <img src={`${TMDB_IMG}${r.poster_path}`} alt={r.title || r.name} className="w-full aspect-[2/3] object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-[2/3] flex items-center justify-center bg-white/[0.02]"><ImageOff className="h-8 w-8 text-muted-foreground/20" /></div>
                  )}
                  <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-between">
                    <p className="text-[10px] text-foreground/70 line-clamp-6 leading-relaxed">{r.overview}</p>
                    <Button size="sm" className="w-full mt-2" onClick={() => handleAdd(r)}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold truncate">{r.title || r.name}</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                      <Star className={`h-2.5 w-2.5 fill-current ${ratingColor(r.vote_average || 0)}`} />
                      <span className={ratingColor(r.vote_average || 0)}>{r.vote_average?.toFixed(1)}</span>
                      {r.release_date && <span>• {r.release_date.slice(0, 4)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Added Movies */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.06]">
          <h3 className="text-base font-bold text-foreground">Filmes Adicionados</h3>
          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1">{movies?.length || 0}</span>
        </div>
        <div className="p-5 sm:p-6">
          {!movies || movies.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="rounded-2xl glass-panel p-6 inline-block"><Film className="h-12 w-12 text-muted-foreground/20" /></div>
              <p className="text-sm font-semibold text-muted-foreground">Nenhum filme adicionado</p>
              <p className="text-xs text-muted-foreground/50">Busque no TMDB para adicionar filmes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {movies.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl glass-panel glass-panel-hover p-3">
                  {m.poster_url ? (
                    <img src={m.poster_url} alt={m.title} className="h-14 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="h-14 w-10 rounded-lg bg-white/[0.03] flex items-center justify-center"><ImageOff className="h-4 w-4 text-muted-foreground/20" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{m.title}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                      {m.year}
                      {m.rating && <><Star className={`h-2.5 w-2.5 fill-current ${ratingColor(m.rating)}`} /><span className={ratingColor(m.rating)}>{m.rating}</span></>}
                    </p>
                  </div>
                  <Switch checked={m.active} onCheckedChange={(v) => toggleMovie.mutate({ id: m.id, active: v })} />
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Remover filme?")) deleteMovie.mutate(m.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
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
