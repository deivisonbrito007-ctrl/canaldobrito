import { useState } from "react";
import { useTMDBSearch, type TMDBResult } from "@/hooks/useTMDB";
import { useAllNewsReleases, useAddNewsRelease, useToggleNewsRelease, useDeleteNewsRelease } from "@/hooks/useNewsReleases";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Trash2, Star, ImageOff, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const TMDB_IMG = "https://image.tmdb.org/t/p/w300";

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
    if (query.trim()) {
      search(searchType === "movie" ? "search_movie" : "search_tv", query);
    }
  };

  const handleAdd = async (r: TMDBResult) => {
    const existing = items?.find((m) => m.tmdb_id === r.id && m.content_type === searchType);
    if (existing) { toast.info("Item já adicionado"); return; }
    try {
      await addItem.mutateAsync({
        tmdb_id: r.id,
        title: r.title || r.name || "",
        content_type: searchType,
        badge_type: badgeType,
        image_url: r.poster_path ? `${TMDB_IMG}${r.poster_path}` : null,
        overview: r.overview || null,
        rating: r.vote_average ? Math.round(r.vote_average * 10) / 10 : null,
        year: (r.release_date || r.first_air_date) ? parseInt(r.release_date || r.first_air_date || "") : null,
        display_order: items?.length ?? 0,
        added_by: user?.id || null,
      });
      toast.success("Item adicionado!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Buscar Conteúdo (TMDB)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select value={searchType} onValueChange={(v) => { setSearchType(v as any); setResults([]); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="movie">🎬 Filme</SelectItem>
                <SelectItem value="series">📺 Série</SelectItem>
              </SelectContent>
            </Select>
            <Select value={badgeType} onValueChange={(v) => setBadgeType(v as any)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novidade">🔥 Novidade</SelectItem>
                <SelectItem value="lancamento">🆕 Lançamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder={searchType === "movie" ? "Nome do filme..." : "Nome da série..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching} size="icon">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

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
                    <img src={`${TMDB_IMG}${r.poster_path}`} alt={r.title || r.name} className="w-full aspect-[2/3] object-cover" loading="lazy" />
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
                    <p className="text-xs font-semibold truncate">{r.title || r.name}</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                      <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                      {r.vote_average?.toFixed(1)}
                      {(r.release_date || r.first_air_date) && ` • ${(r.release_date || r.first_air_date)?.slice(0, 4)}`}
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
            <CardTitle>Itens Adicionados</CardTitle>
            <span className="text-xs text-muted-foreground bg-secondary/60 rounded-full px-2.5 py-1 font-semibold">{items?.length || 0}</span>
          </div>
        </CardHeader>
        <CardContent>
          {!items || items.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="rounded-2xl bg-secondary/50 p-5 inline-block border border-border/20">
                <Sparkles className="h-8 w-8 text-muted-foreground/25" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Nenhum item adicionado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border/20 bg-secondary/15 p-3 transition-all duration-200 hover:bg-secondary/30 hover:border-border/30">
                  {m.image_url ? (
                    <img src={m.image_url} alt={m.title} className="h-14 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="h-14 w-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                      <ImageOff className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{m.title}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 mt-0.5 flex-wrap">
                      <span className={`rounded px-1.5 py-0.5 font-bold text-white ${m.content_type === "movie" ? "bg-emerald-500/80" : "bg-blue-500/80"}`}>
                        {m.content_type === "movie" ? "Filme" : "Série"}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 font-bold text-white ${m.badge_type === "lancamento" ? "bg-purple-500/80" : "bg-orange-500/80"}`}>
                        {m.badge_type === "lancamento" ? "Lançamento" : "Novidade"}
                      </span>
                      {m.year && <span>• {m.year}</span>}
                      {m.rating && (
                        <>
                          <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400 inline" />
                          <span>{m.rating}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Switch checked={m.active} onCheckedChange={(v) => toggleItem.mutate({ id: m.id, active: v })} />
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Remover item?")) deleteItem.mutate(m.id); }}>
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

export default AdminNovidades;
