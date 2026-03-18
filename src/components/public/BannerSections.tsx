import { useBannersByCategory, CATEGORY_LABELS, CATEGORY_LIST, type BannerCategory } from "@/hooks/useBanners";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_ICONS: Record<BannerCategory, string> = {
  cover: "🎬",
  football: "⚽",
  basketball: "🏀",
  ufc: "🥊",
  other_sports: "🏆",
  football_guide: "📋",
};

const CategoryCarousel = ({ category }: { category: BannerCategory }) => {
  const { data: banners, isLoading } = useBannersByCategory(category);
  const [current, setCurrent] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const touchRef = useRef<{ startX: number; startY: number } | null>(null);

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

  useEffect(() => {
    setCurrent(0);
  }, [category]);

  // Touch/swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    const dy = e.changedTouches[0].clientY - touchRef.current.startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      dx < 0 ? next() : prev();
    }
    touchRef.current = null;
  };

  if (isLoading) {
    return <Skeleton className="w-full aspect-[16/9] rounded-2xl" />;
  }

  if (validBanners.length === 0) return null;

  const banner = validBanners[current];

  return (
    <div
      className="relative group"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="overflow-hidden rounded-2xl border border-border/20 shadow-xl shadow-black/20">
        <AnimatePresence mode="wait">
          <motion.img
            key={banner.id}
            src={banner.image_url}
            alt={banner.title || CATEGORY_LABELS[category]}
            className="w-full aspect-[16/9] object-cover"
            loading="lazy"
            onError={() => setImgErrors((prev) => new Set(prev).add(banner.id))}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
          />
        </AnimatePresence>

        {/* Gradient overlay bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background/60 to-transparent pointer-events-none" />
      </div>

      {/* Navigation arrows */}
      {validBanners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/60 backdrop-blur-sm border border-border/30 p-2 text-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-background/80 hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/60 backdrop-blur-sm border border-border/30 p-2 text-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-background/80 hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Progress dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {validBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all min-h-[20px] min-w-[20px] flex items-center justify-center ${
                  i === current
                    ? "w-6 h-2 bg-primary glow-primary"
                    : "w-2 h-2 bg-foreground/30 hover:bg-foreground/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const BannerSection = ({ category }: { category: BannerCategory }) => {
  const { data: banners } = useBannersByCategory(category);

  if (!banners || banners.length === 0) return null;

  return (
    <motion.section
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2 px-1">
        <span className="text-lg">{CATEGORY_ICONS[category]}</span>
        <h2 className="font-display text-sm sm:text-base font-bold text-foreground">
          {CATEGORY_LABELS[category]}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent ml-2" />
      </div>
      <CategoryCarousel category={category} />
    </motion.section>
  );
};

export const BannerSections = () => {
  return (
    <div className="space-y-8">
      {CATEGORY_LIST.map((cat) => (
        <BannerSection key={cat} category={cat} />
      ))}
    </div>
  );
};