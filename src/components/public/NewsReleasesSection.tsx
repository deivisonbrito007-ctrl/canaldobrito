import { useActiveNewsReleases, type NewsRelease } from "@/hooks/useNewsReleases";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const StoryCard = ({ item, index }: { item: NewsRelease; index: number }) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      className="snap-start shrink-0 w-[130px] sm:w-[150px]"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 aspect-[9/16] bg-card group cursor-pointer transition-all duration-300 hover:border-primary/40 glow-primary-subtle">
        {item.image_url && !imgErr ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-card">
            <ImageOff className="h-7 w-7 text-muted-foreground/15" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

        {/* Badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`text-[8px] font-bold text-white px-1.5 py-0.5 rounded-md backdrop-blur-sm ${
              item.badge_type === "lancamento" ? "bg-purple-500/70" : "bg-orange-500/70"
            }`}
          >
            {item.badge_type === "lancamento" ? "🆕" : "🔥"}
          </span>
        </div>

        {/* Title */}
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-[10px] sm:text-[11px] font-bold text-foreground leading-tight line-clamp-2 drop-shadow-lg">
            {item.title}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export const NewsReleasesSection = () => {
  const { data: items, isLoading } = useActiveNewsReleases();

  if (isLoading) {
    return (
      <div className="space-y-4 px-4 sm:px-6">
        <SectionHeader />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[9/16] rounded-2xl w-[130px] shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  const displayItems = items.slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="px-4 sm:px-6">
        <SectionHeader />
      </div>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 sm:px-6 pb-2">
        {displayItems.map((item, idx) => (
          <StoryCard key={item.id} item={item} index={idx} />
        ))}
      </div>
    </div>
  );
};

const SectionHeader = () => (
  <div className="flex items-center gap-2.5">
    <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/15">
      <Sparkles className="h-4 w-4 text-primary" />
    </div>
    <h2 className="font-display text-base sm:text-lg font-extrabold text-foreground tracking-tight">
      Novidades
    </h2>
  </div>
);
