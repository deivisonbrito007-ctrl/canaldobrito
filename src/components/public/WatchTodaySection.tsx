import { useActiveMovies, type FeaturedMovie } from "@/hooks/useMovies";
import { useActiveSeries, type FeaturedSeries } from "@/hooks/useSeries";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Star, ImageOff, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";

type ContentItem = (FeaturedMovie | FeaturedSeries) & { type: "movie" | "series" };

const TypeBadge = ({ type }: { type: "movie" | "series" }) => (
  <div
    className={`absolute top-2.5 left-2.5 z-10 flex items-center gap-1 rounded-lg backdrop-blur-sm px-2 py-0.5 shadow-md ${
      type === "movie"
        ? "bg-emerald-500/80 text-white"
        : "bg-blue-500/80 text-white"
    }`}
  >
    <span className="text-[10px] font-bold leading-none">
      {type === "movie" ? "🎬 Filme" : "📺 Série"}
    </span>
  </div>
);

const ContentCard = ({ item, index }: { item: ContentItem; index: number }) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: "easeOut" }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/20 bg-card premium-shadow-sm aspect-[2/3] transition-all duration-300 group-hover:scale-[1.03] group-hover:premium-shadow group-hover:border-primary/20">
        {item.poster_url && !imgErr ? (
          <img
            src={item.poster_url}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/50 gap-2">
            <ImageOff className="h-10 w-10 text-muted-foreground/20" />
            <span className="text-[10px] text-muted-foreground/30 font-medium">Sem imagem</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 sm:block hidden" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

        <TypeBadge type={item.type} />

        {item.rating && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-lg bg-amber-500/90 backdrop-blur-sm px-2 py-1 shadow-md">
            <Star className="h-3 w-3 text-white fill-white" />
            <span className="text-[11px] font-bold text-white">{Number(item.rating).toFixed(1)}</span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3.5 space-y-1.5">
          <p className="text-sm font-bold text-foreground leading-tight line-clamp-2 drop-shadow-lg">
            {item.title}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {item.year && (
              <span className="text-[11px] text-foreground/50 font-medium">{item.year}</span>
            )}
            {item.genre && (
              <span className="text-[10px] text-primary font-semibold bg-primary/15 rounded-full px-2 py-0.5 border border-primary/20">
                {item.genre.split(",")[0]}
              </span>
            )}
          </div>
          {item.overview && (
            <p className="text-[11px] text-foreground/40 line-clamp-2 leading-relaxed">
              {item.overview}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const WatchTodaySection = () => {
  const { data: movies, isLoading: loadingMovies } = useActiveMovies();
  const { data: series, isLoading: loadingSeries } = useActiveSeries();

  const isLoading = loadingMovies || loadingSeries;

  const items = useMemo<ContentItem[]>(() => {
    const movieItems: ContentItem[] = (movies ?? []).map((m) => ({ ...m, type: "movie" as const }));
    const seriesItems: ContentItem[] = (series ?? []).map((s) => ({ ...s, type: "series" as const }));
    return [...movieItems, ...seriesItems].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [movies, series]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <SectionHeader />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-5">
        <SectionHeader />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-2xl bg-secondary/50 p-5 mb-4 border border-border/20">
            <Play className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Nenhum conteúdo em destaque</p>
          <p className="text-xs text-muted-foreground/50 mt-1.5">Volte mais tarde para novidades</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader count={items.length} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
        {items.map((item, idx) => (
          <ContentCard key={item.id} item={item} index={idx} />
        ))}
      </div>
    </div>
  );
};

const SectionHeader = ({ count }: { count?: number }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2.5">
      <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
        <Play className="h-4.5 w-4.5 text-primary" />
      </div>
      <h2 className="font-display text-base sm:text-lg font-bold text-foreground tracking-tight">
        Assista Hoje
      </h2>
    </div>
    {count !== undefined && (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 bg-secondary/50 rounded-full px-3 py-1 border border-border/20">
        <TrendingUp className="h-3.5 w-3.5" />
        <span className="font-semibold">{count}</span>
      </div>
    )}
  </div>
);
