import { useActiveMovies, type FeaturedMovie } from "@/hooks/useMovies";
import { useActiveSeries, type FeaturedSeries } from "@/hooks/useSeries";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Star, ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";

type ContentItem = (FeaturedMovie | FeaturedSeries) & { type: "movie" | "series" };

const TypeBadge = ({ type }: { type: "movie" | "series" }) => (
  <div
    className={`absolute top-2 left-2 z-10 flex items-center gap-0.5 rounded-md backdrop-blur-sm px-1.5 py-0.5 shadow-md ${
      type === "movie" ? "bg-emerald-500/80 text-white" : "bg-blue-500/80 text-white"
    }`}
  >
    <span className="text-[9px] font-bold leading-none">
      {type === "movie" ? "🎬" : "📺"}
    </span>
  </div>
);

const ContentCard = ({ item, index }: { item: ContentItem; index: number }) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
    >
      <div className="relative overflow-hidden rounded-xl border border-border/20 bg-card aspect-[2/3] transition-all duration-300 group-hover:scale-[1.02] group-hover:border-primary/20">
        {item.poster_url && !imgErr ? (
          <img
            src={item.poster_url}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/50 gap-1.5">
            <ImageOff className="h-8 w-8 text-muted-foreground/20" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        <TypeBadge type={item.type} />

        {item.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded-md bg-amber-500/90 backdrop-blur-sm px-1.5 py-0.5 shadow-md">
            <Star className="h-2.5 w-2.5 text-white fill-white" />
            <span className="text-[9px] font-bold text-white">{Number(item.rating).toFixed(1)}</span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-2.5 space-y-1">
          <p className="text-[11px] sm:text-sm font-bold text-foreground leading-tight line-clamp-2 drop-shadow-lg">
            {item.title}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.year && (
              <span className="text-[9px] text-foreground/50 font-medium">{item.year}</span>
            )}
            {item.genre && (
              <span className="text-[8px] text-primary font-semibold bg-primary/15 rounded-full px-1.5 py-0.5 border border-primary/20">
                {item.genre.split(",")[0]}
              </span>
            )}
          </div>
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
      <div className="space-y-3">
        <SectionHeader />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <SectionHeader />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, idx) => (
          <ContentCard key={item.id} item={item} index={idx} />
        ))}
      </div>
    </div>
  );
};

const SectionHeader = () => (
  <div className="flex items-center gap-2">
    <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
      <Play className="h-4 w-4 text-primary" />
    </div>
    <h2 className="font-display text-sm sm:text-lg font-bold text-foreground tracking-tight">
      Assista Hoje
    </h2>
  </div>
);
