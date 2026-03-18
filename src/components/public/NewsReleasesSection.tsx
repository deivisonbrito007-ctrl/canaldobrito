import { useActiveNewsReleases, type NewsRelease } from "@/hooks/useNewsReleases";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const StoryCard = ({ item, index }: { item: NewsRelease; index: number }) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      className="snap-start shrink-0 w-[100px] sm:w-[120px]"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 aspect-[9/16] bg-card">
        {item.image_url && !imgErr ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/50">
            <ImageOff className="h-6 w-6 text-muted-foreground/20" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent" />

        {/* Badge */}
        <div className="absolute top-1.5 left-1.5">
          <span
            className={`text-[7px] font-bold text-white px-1 py-0.5 rounded ${
              item.badge_type === "lancamento" ? "bg-purple-500/80" : "bg-orange-500/80"
            }`}
          >
            {item.badge_type === "lancamento" ? "🆕" : "🔥"}
          </span>
        </div>

        {/* Title */}
        <div className="absolute bottom-1.5 left-1.5 right-1.5">
          <p className="text-[9px] font-bold text-foreground leading-tight line-clamp-2 drop-shadow-lg">
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
      <div className="space-y-3 px-3 sm:px-6">
        <SectionHeader />
        <div className="flex gap-2.5 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[9/16] rounded-2xl w-[100px] shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  const displayItems = items.slice(0, 6);

  return (
    <div className="space-y-3">
      <div className="px-3 sm:px-6">
        <SectionHeader />
      </div>
      <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-3 sm:px-6 pb-1">
        {displayItems.map((item, idx) => (
          <StoryCard key={item.id} item={item} index={idx} />
        ))}
      </div>
    </div>
  );
};

const SectionHeader = () => (
  <div className="flex items-center gap-2">
    <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
      <Sparkles className="h-4 w-4 text-primary" />
    </div>
    <h2 className="font-display text-sm sm:text-lg font-bold text-foreground tracking-tight">
      Novidades
    </h2>
  </div>
);
