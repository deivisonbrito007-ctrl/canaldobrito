import { useBannersByCategory, CATEGORY_LIST, type BannerCategory } from "@/hooks/useBanners";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_CONFIG: Record<BannerCategory, { emoji: string; label: string }> = {
  cover: { emoji: "📺", label: "Capa" },
  football: { emoji: "⚽", label: "Futebol" },
  basketball: { emoji: "🏀", label: "Basquete" },
  ufc: { emoji: "🥊", label: "UFC/MMA" },
  other_sports: { emoji: "🏆", label: "Demais Esportes" },
  football_guide: { emoji: "📋", label: "Guia do Futebol" },
};

const CategoryCarousel = ({ category }: { category: BannerCategory }) => {
  const { data: banners, isLoading } = useBannersByCategory(category);
  const [current, setCurrent] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const touchRef = useRef<{ startX: number } | null>(null);

  const validBanners = banners?.filter((b) => !imgErrors.has(b.id)) || [];

  const next = useCallback(() => {
    if (validBanners.length > 1) setCurrent((c) => (c + 1) % validBanners.length);
  }, [validBanners.length]);

  const prev = useCallback(() => {
    if (validBanners.length > 1) setCurrent((c) => (c - 1 + validBanners.length) % validBanners.length);
  }, [validBanners.length]);

  useEffect(() => {
    if (validBanners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, validBanners.length]);

  useEffect(() => { setCurrent(0); }, [category]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { startX: e.touches[0].clientX };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); }
    touchRef.current = null;
  };

  if (isLoading) return <Skeleton className="w-full aspect-video rounded-2xl mx-4" />;
  if (validBanners.length === 0) return null;

  const banner = validBanners[current];

  return (
    <div className="relative group" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="overflow-hidden rounded-2xl mx-4 sm:mx-6 transition-transform duration-300 group-hover:scale-[1.01]">
        <AnimatePresence mode="wait">
          <motion.div
            key={banner.id}
            className="relative"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <img
              src={banner.image_url}
              alt={banner.title || CATEGORY_CONFIG[category].label}
              className="w-full aspect-video object-cover"
              loading="lazy"
              onError={() => setImgErrors((prev) => new Set(prev).add(banner.id))}
            />
            {/* Overlay with title */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            {banner.title && (
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-sm sm:text-base font-bold text-foreground drop-shadow-lg line-clamp-2">
                  {banner.title}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Desktop arrows */}
      {validBanners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="hidden sm:flex absolute left-8 top-1/2 -translate-y-1/2 rounded-full bg-card/60 backdrop-blur-md border border-border/10 p-2 text-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 min-h-[40px] min-w-[40px] items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="hidden sm:flex absolute right-8 top-1/2 -translate-y-1/2 rounded-full bg-card/60 backdrop-blur-md border border-border/10 p-2 text-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 min-h-[40px] min-w-[40px] items-center justify-center"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Dots */}
      {validBanners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {validBanners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 min-h-[14px] min-w-[14px] flex items-center justify-center ${
                i === current
                  ? "w-5 h-1.5 bg-primary shadow-[0_0_8px_hsl(142,60%,45%,0.5)]"
                  : "w-1.5 h-1.5 bg-foreground/20 hover:bg-foreground/35"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const BannerSection = ({ category }: { category: BannerCategory }) => {
  const { data: banners } = useBannersByCategory(category);
  if (!banners || banners.length === 0) return null;

  const config = CATEGORY_CONFIG[category];

  return (
    <motion.section
      className="space-y-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2.5 px-4 sm:px-6">
        <span className="text-lg">{config.emoji}</span>
        <h2 className="font-display text-base sm:text-lg font-extrabold text-foreground tracking-tight">{config.label}</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-border/20 to-transparent" />
      </div>
      <CategoryCarousel category={category} />
    </motion.section>
  );
};

export const BannerSections = () => {
  return (
    <div className="space-y-12">
      {CATEGORY_LIST.map((cat) => (
        <BannerSection key={cat} category={cat} />
      ))}
    </div>
  );
};
