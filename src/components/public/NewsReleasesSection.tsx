import { useActiveNewsReleases, type NewsRelease } from "@/hooks/useNewsReleases";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ImageOff, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const ContentBadge = ({ type }: { type: string }) => (
  <span
    className={`flex items-center gap-0.5 rounded-md backdrop-blur-sm px-1.5 py-0.5 shadow-md text-[8px] font-bold leading-none text-white ${
      type === "movie" ? "bg-emerald-500/80" : "bg-blue-500/80"
    }`}
  >
    {type === "movie" ? "🎬" : "📺"}
  </span>
);

const BadgeType = ({ badge }: { badge: string }) => (
  <span
    className={`flex items-center gap-0.5 rounded-md backdrop-blur-sm px-1.5 py-0.5 shadow-md text-[8px] font-bold leading-none text-white ${
      badge === "lancamento" ? "bg-purple-500/80" : "bg-orange-500/80"
    }`}
  >
    {badge === "lancamento" ? "🆕" : "🔥"}
  </span>
);

const NewsCard = ({ item, index }: { item: NewsRelease; index: number }) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      className="group snap-start shrink-0 w-[130px] sm:w-[180px]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
    >
      <div className="relative overflow-hidden rounded-xl border border-border/20 bg-card aspect-[2/3] transition-all duration-300 group-hover:scale-[1.03] group-hover:border-primary/20">
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
            <ImageOff className="h-8 w-8 text-muted-foreground/20" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

        {/* Badges top-left */}
        <div className="absolute top-2 left-2 z-10 flex gap-1">
          <ContentBadge type={item.content_type} />
          <BadgeType badge={item.badge_type} />
        </div>

        {/* Rating top-right */}
        {item.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded-md bg-amber-500/90 backdrop-blur-sm px-1.5 py-0.5 shadow-md">
            <Star className="h-2.5 w-2.5 text-white fill-white" />
            <span className="text-[9px] font-bold text-white">{Number(item.rating).toFixed(1)}</span>
          </div>
        )}

        {/* Info bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2 space-y-0.5">
          <p className="text-[11px] sm:text-sm font-bold text-foreground leading-tight line-clamp-2 drop-shadow-lg">
            {item.title}
          </p>
          {item.year && (
            <span className="text-[9px] text-foreground/50 font-medium">{item.year}</span>
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
      <div className="space-y-3 px-3 sm:px-6">
        <SectionHeader />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-xl w-[130px] shrink-0 sm:w-[180px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  // Limit to 5 on mobile via CSS, show all on desktop
  const displayItems = items.slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="px-3 sm:px-6">
        <SectionHeader count={displayItems.length} />
      </div>
      <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-3 sm:px-6 pb-1">
        {displayItems.map((item, idx) => (
          <NewsCard key={item.id} item={item} index={idx} />
        ))}
      </div>
    </div>
  );
};

const SectionHeader = ({ count }: { count?: number }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <h2 className="font-display text-sm sm:text-lg font-bold text-foreground tracking-tight">
        Novidades
      </h2>
    </div>
    {count !== undefined && (
      <span className="text-[10px] text-muted-foreground/50 font-semibold">{count}</span>
    )}
  </div>
);
