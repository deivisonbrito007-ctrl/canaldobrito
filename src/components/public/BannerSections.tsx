import { useBannersByCategory, CATEGORY_LABELS, CATEGORY_LIST, type BannerCategory } from "@/hooks/useBanners";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CategoryCarousel = ({ category }: { category: BannerCategory }) => {
  const { data: banners, isLoading } = useBannersByCategory(category);
  const [current, setCurrent] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const validBanners = banners?.filter((b) => !imgErrors.has(b.id)) || [];

  const next = useCallback(() => {
    if (validBanners.length > 1) setCurrent((c) => (c + 1) % validBanners.length);
  }, [validBanners.length]);

  const prev = useCallback(() => {
    if (validBanners.length > 1) setCurrent((c) => (c - 1 + validBanners.length) % validBanners.length);
  }, [validBanners.length]);

  // Auto-play
  useEffect(() => {
    if (validBanners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, validBanners.length]);

  // Reset index when banners change
  useEffect(() => {
    setCurrent(0);
  }, [category]);

  if (isLoading) {
    return <Skeleton className="w-full aspect-[16/9] rounded-xl" />;
  }

  if (validBanners.length === 0) return null;

  const banner = validBanners[current];

  return (
    <div className="relative group">
      <div className="overflow-hidden rounded-xl border border-border/30">
        <AnimatePresence mode="wait">
          <motion.img
            key={banner.id}
            src={banner.image_url}
            alt={banner.title || CATEGORY_LABELS[category]}
            className="w-full aspect-[16/9] object-cover"
            loading="lazy"
            onError={() => setImgErrors((prev) => new Set(prev).add(banner.id))}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {validBanners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {validBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${i === current ? "w-4 bg-primary" : "w-1.5 bg-foreground/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const BannerSections = () => {
  return (
    <div className="space-y-6">
      {CATEGORY_LIST.map((cat) => (
        <BannerSection key={cat} category={cat} />
      ))}
    </div>
  );
};

const BannerSection = ({ category }: { category: BannerCategory }) => {
  const { data: banners } = useBannersByCategory(category);

  // Hide section if no active banners
  if (!banners || banners.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="font-display text-sm sm:text-base font-bold text-foreground px-1">
        {CATEGORY_LABELS[category]}
      </h2>
      <CategoryCarousel category={category} />
    </section>
  );
};
