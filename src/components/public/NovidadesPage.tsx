import { useMemo, useState } from "react";
import { Grid, List, Search } from "lucide-react";
import { useActiveNewsReleases, type NewsRelease } from "@/hooks/useNewsReleases";
import { useActiveMovies } from "@/hooks/useMovies";
import { useActiveSeries } from "@/hooks/useSeries";
import { ContentDetailSheet } from "@/components/public/ContentDetailSheet";
import { FilterChip } from "@/components/public/novidades/FilterChip";
import { FeaturedCarousel } from "@/components/public/novidades/FeaturedCarousel";
import { ContentCard } from "@/components/public/novidades/ContentCard";
import { ContentListItem } from "@/components/public/novidades/ContentListItem";
import { SearchModal } from "@/components/public/novidades/SearchModal";
import { WeeklyMoviesSection } from "@/components/public/WeeklyMoviesSection";
import { WeeklySeriesSection } from "@/components/public/WeeklySeriesSection";
import { trackContentClick } from "@/lib/analytics";

type FilterId = "all" | "movie" | "series" | "lancamento" | "estreia" | "exclusivo";

const FILTERS: { id: FilterId; icon: string; label: string }[] = [
  { id: "all", icon: "✨", label: "Todos" },
  { id: "movie", icon: "🎬", label: "Filmes" },
  { id: "series", icon: "📺", label: "Séries" },
  { id: "lancamento", icon: "🆕", label: "Lançamentos" },
  { id: "estreia", icon: "⭐", label: "Estreias" },
  { id: "exclusivo", icon: "👑", label: "Exclusivos" },
];

const PosterSkeletonGrid = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 px-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="aspect-[2/3] rounded-xl skeleton-shimmer" />
        <div className="h-4 rounded skeleton-shimmer" />
        <div className="h-3 w-2/3 rounded skeleton-shimmer" />
      </div>
    ))}
  </div>
);

export const NovidadesPage = () => {
  const { data: items, isLoading } = useActiveNewsReleases();
  const [filter, setFilter] = useState<FilterId>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState<NewsRelease | null>(null);

  const all = items ?? [];

  const stats = useMemo(() => {
    const isMovie = (i: NewsRelease) => i.content_type === "movie";
    const isSeries = (i: NewsRelease) => i.content_type === "series" || i.content_type === "tv";
    return {
      all: all.length,
      movie: all.filter(isMovie).length,
      series: all.filter(isSeries).length,
      lancamento: all.filter((i) => i.badge_type === "lancamento").length,
      estreia: all.filter((i) => i.badge_type === "estreia").length,
      exclusivo: all.filter((i) => i.badge_type === "exclusivo").length,
    } as Record<FilterId, number>;
  }, [all]);

  const filtered = useMemo(() => {
    if (filter === "all") return all;
    if (filter === "movie") return all.filter((i) => i.content_type === "movie");
    if (filter === "series") return all.filter((i) => i.content_type === "series" || i.content_type === "tv");
    return all.filter((i) => i.badge_type === filter);
  }, [all, filter]);

  const featured = useMemo(() => filtered.slice(0, Math.min(5, filtered.length)), [filtered]);
  const filterLabel = FILTERS.find((f) => f.id === filter)?.label ?? "Todos";

  const handleSelect = (item: NewsRelease) => {
    trackContentClick({
      surface: "novidades_page",
      content_type: item.content_type ?? "news",
      content_id: item.tmdb_id ?? item.id,
      content_title: item.title,
      action: "open",
    });
    setSelected(item);
  };

  return (
    <div className="space-y-5 min-h-[80vh] pt-2 pb-2 animate-fade-up">
      {/* Hero header */}
      <div className="px-4 pt-4 pb-2 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h1 className="font-display text-3xl text-foreground tracking-wide leading-none">
              NOVIDADES <span className="text-primary">🎬</span>
            </h1>
            <p className="text-xs text-muted-foreground font-body">
              {isLoading ? "Carregando..." : `${stats.all} ${stats.all === 1 ? "título disponível" : "títulos disponíveis"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar"
            className="flex items-center justify-center w-11 h-11 rounded-full bg-surface-2 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors min-h-[44px] min-w-[44px] shrink-0"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Filtros rápidos */}
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide -mx-1 px-1 [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]">
          {FILTERS.filter((f) => f.id === "all" || (stats[f.id] ?? 0) > 0).map((f) => (
            <FilterChip
              key={f.id}
              icon={f.icon}
              label={f.label}
              count={stats[f.id] ?? 0}
              active={filter === f.id}
              onClick={() => setFilter(f.id)}
            />
          ))}
        </div>
      </div>

      {/* Carrossel Em Destaque */}
      {isLoading ? (
        <div className="px-4">
          <div className="h-[420px] rounded-2xl skeleton-shimmer" />
        </div>
      ) : featured.length > 0 ? (
        <FeaturedCarousel items={featured} onSelect={handleSelect} />
      ) : null}

      {/* Grid / Lista */}
      <div className="space-y-3">
        <div className="px-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground font-body">
            {filter === "all" ? "Todos os Títulos" : filterLabel}
            <span className="ml-2 text-muted-foreground font-normal tabular-nums">({filtered.length})</span>
          </h2>
          <button
            type="button"
            onClick={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-body min-h-[36px] px-2 rounded-lg"
            aria-label={`Mudar para visão em ${viewMode === "grid" ? "lista" : "grade"}`}
          >
            {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            {viewMode === "grid" ? "Lista" : "Grade"}
          </button>
        </div>

        {isLoading ? (
          <PosterSkeletonGrid />
        ) : filtered.length === 0 ? (
          <div className="px-4">
            <div className="rounded-2xl border border-border bg-surface-2 p-8 text-center space-y-2">
              <p className="text-sm font-bold text-foreground font-body">Nada por aqui ainda</p>
              <p className="text-xs text-muted-foreground font-body">
                Tente outro filtro ou volte mais tarde para conferir as novidades.
              </p>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 px-4">
            {filtered.map((item) => (
              <ContentCard key={item.id} item={item} onSelect={handleSelect} />
            ))}
          </div>
        ) : (
          <div className="px-4 space-y-2">
            {filtered.map((item) => (
              <ContentListItem key={item.id} item={item} onSelect={handleSelect} />
            ))}
          </div>
        )}
      </div>

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        items={all}
        onSelect={handleSelect}
      />

      <ContentDetailSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        item={selected ? {
          title: selected.title,
          overview: selected.overview,
          poster_url: selected.image_url,
          backdrop_url: selected.backdrop_url,
          rating: selected.rating,
          year: selected.year,
          genre: selected.genres,
          tmdb_id: selected.tmdb_id,
          content_type: selected.content_type,
        } : null}
      />
    </div>
  );
};

export default NovidadesPage;
