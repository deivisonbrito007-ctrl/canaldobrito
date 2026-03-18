import { useState } from "react";
import { useTMDBSearch, type TMDBResult } from "@/hooks/useTMDB";
import { useAllMovies, useAddMovie, useToggleMovie, useDeleteMovie } from "@/hooks/useMovies";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Trash2, Star, ImageOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TMDB_IMG = "https://image.tmdb.org/t/p/w300";

const AdminFilmes = () => {
  const { user } = useAuth();
  const { results, loading: searching, search } = useTMDBSearch();
  const { data: movies } = useAllMovies();
  const addMovie = useAddMovie();
  const toggleMovie = useToggleMovie();
  const deleteMovie = useDeleteMovie();
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (query.trim()) search("search_movie", query);
  };

  const loadNowPlaying = () => search("now_playing");

  const handleAdd = async (r: TMDBResult) => {
    const existing = movies?.find((m) => m.tmdb_id === r.id);
    if (existing) { toast.info("Filme já adicionado"); return; }
    try {
      await addMovie.mutateAsync({
        tmdb_id: r.id,
        title: r.title || r.name || "",
        poster_url: r.poster_path ? `${TMDB_IMG}${r.poster_path}` : null,
        overview: r.overview || null,
        rating: r.vote_average ? Math.round(r.vote_average * 10) / 10 : null,
        year: r.release_date ? parseInt(r.release_date) : null,
        genre: null,
        added_by: user?.id || null,
      });
      toast.success("Filme adicionado!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buscar Filmes (TMDB)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="search">
            <TabsList>
              <TabsTrigger value="search">Buscar</TabsTrigger>
              <TabsTrigger value="trending" onClick={loadNowPlaying}>Lançamentos</TabsTrigger>
            </TabsList>
            <TabsContent value="search" className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="Nome do filme..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="trending" />
          </Tabs>

          {searching && <p className="text-sm text-muted-foreground">Buscando...</p>}

          {results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {results.map((r) => (
                <div key={r.id} className="group relative rounded-lg border border-border/30 bg-card overflow-hidden">
                  {r.poster_path ? (
                    <img src={`${TMDB_IMG}${r.poster_path}`} alt={r.title || r.name} className="w-full aspect-[2/3] object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-[2/3] flex items-center justify-center bg-secondary">
                      <ImageOff className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                    <p className="text-[10px] text-foreground/80 line-clamp-6">{r.overview}</p>
                    <Button size="sm" className="w-full mt-1" onClick={() => handleAdd(r)}>
                      <Plus className="h-3 w-3 mr-1" /> Adicionar
                    </Button>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{r.title || r.name}</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                      {r.vote_average?.toFixed(1)}
                      {r.release_date && ` • ${r.release_date.slice(0, 4)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Added movies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filmes Adicionados ({movies?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!movies || movies.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum filme adicionado</p>
          ) : (
            <div className="space-y-2">
              {movies.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-2">
                  {m.poster_url ? (
                    <img src={m.poster_url} alt={m.title} className="h-14 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-14 w-10 rounded bg-secondary flex items-center justify-center">
                      <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.title}</p>
                    <p className="text-[10px] text-muted-foreground">{m.year} • ⭐ {m.rating}</p>
                  </div>
                  <Switch checked={m.active} onCheckedChange={(v) => toggleMovie.mutate({ id: m.id, active: v })} />
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Remover filme?")) deleteMovie.mutate(m.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFilmes;
