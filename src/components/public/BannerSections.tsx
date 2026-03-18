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

  if (isLoading) return <Skeleton className="w-full aspect-video" />;
  if (validBanners.length === 0) return null;

  const banner = validBanners[current];

  return (
    <div className="relative group" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Full-width image, no border-radius on mobile */}
      <div className="overflow-hidden sm:rounded-xl sm:mx-4">
        <AnimatePresence mode="wait">
          <motion.img
            key={banner.id}
            src={banner.image_url}
            alt={banner.title || CATEGORY_CONFIG[category].label}
            className="w-full aspect-video object-cover"
            loading="lazy"
            onError={() => setImgErrors((prev) => new Set(prev).add(banner.id))}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>
        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/70 to-transparent pointer-events-none" />
      </div>

      {/* Desktop arrows */}
      {validBanners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="hidden sm:flex absolute left-5 top-1/2 -translate-y-1/2 rounded-full bg-background/50 backdrop-blur-sm border border-border/30 p-2 text-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-background/80 min-h-[44px] min-w-[44px] items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="hidden sm:flex absolute right-5 top-1/2 -translate-y-1/2 rounded-full bg-background/50 backdrop-blur-sm border border-border/30 p-2 text-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-background/80 min-h-[44px] min-w-[44px] items-center justify-center"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {validBanners.length > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {validBanners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all min-h-[16px] min-w-[16px] flex items-center justify-center ${
                i === current ? "w-5 h-1.5 bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]" : "w-1.5 h-1.5 bg-foreground/30"
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
      className="space-y-2"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 px-4">
        <span className="text-base">{config.emoji}</span>
        <h2 className="font-display text-sm font-bold text-foreground">{config.label}</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-border/40 to-transparent" />
      </div>
      <CategoryCarousel category={category} />
    </motion.section>
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