import { useActiveNewsReleases, type NewsRelease } from "@/hooks/useNewsReleases";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ImageOff, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const ContentBadge = ({ type }: { type: string }) => (
  <span
    className={`flex items-center gap-1 rounded-lg backdrop-blur-sm px-2 py-0.5 shadow-md text-[10px] font-bold leading-none text-white ${
      type === "movie" ? "bg-emerald-500/80" : "bg-blue-500/80"
    }`}
  >
    {type === "movie" ? "🎬 Filme" : "📺 Série"}
  </span>
);

const BadgeType = ({ badge }: { badge: string }) => (
  <span
    className={`flex items-center gap-1 rounded-lg backdrop-blur-sm px-2 py-0.5 shadow-md text-[10px] font-bold leading-none text-white ${
      badge === "lancamento" ? "bg-purple-500/80" : "bg-orange-500/80"
    }`}
  >
    {badge === "lancamento" ? "🆕 Lançamento" : "🔥 Novidade"}
  </span>
);

const NewsCard = ({ item, index }: { item: NewsRelease; index: number }) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      className="group snap-start shrink-0 w-[180px] sm:w-auto"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/20 bg-card aspect-[2/3] transition-all duration-300 group-hover:scale-[1.03] group-hover:border-primary/20">
        {item.image_url && !imgErr ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/50 gap-2">
            <ImageOff className="h-10 w-10 text-muted-foreground/20" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

        {/* Badges top-left */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
          <ContentBadge type={item.content_type} />
          <BadgeType badge={item.badge_type} />
        </div>

        {/* Rating top-right */}
        {item.rating && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-lg bg-amber-500/90 backdrop-blur-sm px-2 py-1 shadow-md">
            <Star className="h-3 w-3 text-white fill-white" />
            <span className="text-[11px] font-bold text-white">{Number(item.rating).toFixed(1)}</span>
          </div>
        )}

        {/* Info bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
          <p className="text-sm font-bold text-foreground leading-tight line-clamp-2 drop-shadow-lg">
            {item.title}
          </p>
          {item.year && (
            <span className="text-[11px] text-foreground/50 font-medium">{item.year}</span>
          )}
          {item.overview && (
            <p className="text-[10px] text-foreground/40 line-clamp-2 leading-relaxed hidden sm:block">
              {item.overview}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const NewsReleasesSection = () => {
  const { data: items, isLoading } = useActiveNewsReleases();

  if (isLoading) {
    return (
      <div className="space-y-5 px-4 sm:px-6">
        <SectionHeader />
        <div className="flex gap-4 overflow-hidden sm:grid sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-2xl w-[160px] shrink-0 sm:w-auto" />
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-5">
      <div className="px-4 sm:px-6">
        <SectionHeader count={items.length} />
      </div>
      {/* Mobile: horizontal scroll | Desktop: grid */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 sm:px-6 sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-5 sm:overflow-visible">
        {items.map((item, idx) => (
          <NewsCard key={item.id} item={item} index={idx} />
        ))}
      </div>
    </div>
  );
};

const SectionHeader = ({ count }: { count?: number }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2.5">
      <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
        <Sparkles className="h-4.5 w-4.5 text-primary" />
      </div>
      <h2 className="font-display text-base sm:text-lg font-bold text-foreground tracking-tight">
        Novidades & Lançamentos
      </h2>
    </div>
    {count !== undefined && (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 bg-secondary/50 rounded-full px-3 py-1 border border-border/20">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="font-semibold">{count}</span>
      </div>
    )}
  </div>
);
