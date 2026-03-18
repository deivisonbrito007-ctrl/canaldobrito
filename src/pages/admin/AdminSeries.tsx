import { useState } from "react";
import { useTMDBSearch, type TMDBResult } from "@/hooks/useTMDB";
import { useAllSeries, useAddSeries, useToggleSeries, useDeleteSeries } from "@/hooks/useSeries";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Trash2, Star, ImageOff, Loader2, Clapperboard } from "lucide-react";
import { toast } from "sonner";

const TMDB_IMG = "https://image.tmdb.org/t/p/w300";

const AdminSeries = () => {
  const { user } = useAuth();
  const { results, loading: searching, search } = useTMDBSearch();
  const { data: series } = useAllSeries();
  const addSeries = useAddSeries();
  const toggleSeries = useToggleSeries();
  const deleteSeries = useDeleteSeries();
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (query.trim()) search("search_tv", query);
  };

  const loadPopular = () => search("popular_tv");

  const handleAdd = async (r: TMDBResult) => {
    const existing = series?.find((s) => s.tmdb_id === r.id);
    if (existing) { toast.info("Série já adicionada"); return; }
    try {
      await addSeries.mutateAsync({
        tmdb_id: r.id,
        title: r.name || r.title || "",
        poster_url: r.poster_path ? `${TMDB_IMG}${r.poster_path}` : null,
        overview: r.overview || null,
        rating: r.vote_average ? Math.round(r.vote_average * 10) / 10 : null,
        year: r.first_air_date ? parseInt(r.first_air_date) : null,
        genre: null,
        added_by: user?.id || null,
      });
      toast.success("Série adicionada!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Buscar Séries (TMDB)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="search">
            <TabsList className="bg-secondary/50 border border-border/20 rounded-xl p-1">
              <TabsTrigger value="search" className="rounded-lg font-semibold text-xs">Buscar</TabsTrigger>
              <TabsTrigger value="popular" onClick={loadPopular} className="rounded-lg font-semibold text-xs">Populares</TabsTrigger>
            </TabsList>
            <TabsContent value="search" className="space-y-3 mt-4">
              <div className="flex gap-2">
                <Input placeholder="Nome da série..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
                <Button onClick={handleSearch} disabled={searching} size="icon">
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="popular" />
          </Tabs>

          {searching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando...
            </div>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {results.map((r) => (
                <div key={r.id} className="group relative rounded-xl border border-border/20 bg-card overflow-hidden transition-all duration-200 hover:border-border/40">
                  {r.poster_path ? (
                    <img src={`${TMDB_IMG}${r.poster_path}`} alt={r.name || r.title} className="w-full aspect-[2/3] object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-[2/3] flex items-center justify-center bg-secondary/50">
                      <ImageOff className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex flex-col justify-between">
                    <p className="text-[10px] text-foreground/70 line-clamp-6 leading-relaxed">{r.overview}</p>
                    <Button size="sm" className="w-full mt-2" onClick={() => handleAdd(r)}>
                      <Plus className="h-3 w-3 mr-1" /> Adicionar
                    </Button>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold truncate">{r.name || r.title}</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                      <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                      {r.vote_average?.toFixed(1)}
                      {r.first_air_date && ` • ${r.first_air_date.slice(0, 4)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>Séries Adicionadas</CardTitle>
            <span className="text-xs text-muted-foreground bg-secondary/60 rounded-full px-2.5 py-1 font-semibold">{series?.length || 0}</span>
          </div>
        </CardHeader>
        <CardContent>
          {!series || series.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="rounded-2xl bg-secondary/50 p-5 inline-block border border-border/20">
                <Clapperboard className="h-8 w-8 text-muted-foreground/25" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Nenhuma série adicionada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {series.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border/20 bg-secondary/15 p-3 transition-all duration-200 hover:bg-secondary/30 hover:border-border/30">
                  {s.poster_url ? (
                    <img src={s.poster_url} alt={s.title} className="h-14 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="h-14 w-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                      <ImageOff className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{s.title}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                      {s.year}
                      <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400 inline" />
                      {s.rating}
                    </p>
                  </div>
                  <Switch checked={s.active} onCheckedChange={(v) => toggleSeries.mutate({ id: s.id, active: v })} />
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Remover série?")) deleteSeries.mutate(s.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
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

export default AdminSeries;
