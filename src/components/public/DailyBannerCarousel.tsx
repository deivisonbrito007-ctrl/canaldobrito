import { useDailyBanners } from "@/hooks/useDailyBanners";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const DailyBannerCarousel = () => {
  const { data: banners, isLoading } = useDailyBanners();
  const [current, setCurrent] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const touchRef = useRef<{ startX: number } | null>(null);
  const [progress, setProgress] = useState(0);

  const validBanners = banners?.filter((b) => !imgErrors.has(b.id)) || [];

  const next = useCallback(() => {
    if (validBanners.length > 1) setCurrent((c) => (c + 1) % validBanners.length);
  }, [validBanners.length]);

  const prev = useCallback(() => {
    if (validBanners.length > 1) setCurrent((c) => (c - 1 + validBanners.length) % validBanners.length);
  }, [validBanners.length]);

  useEffect(() => {
    if (validBanners.length <= 1) return;
    setProgress(0);
    const duration = 6000;
    const step = 50;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += step;
      setProgress((elapsed / duration) * 100);
      if (elapsed >= duration) {
        next();
        elapsed = 0;
        setProgress(0);
      }
    }, step);
    return () => clearInterval(timer);
  }, [next, validBanners.length, current]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { startX: e.touches[0].clientX };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); }
    touchRef.current = null;
  };

  if (isLoading) {
    return <Skeleton className="w-full h-[65vh] sm:h-[60vh]" />;
  }

  if (validBanners.length === 0) {
    return (
      <div className="px-3 sm:px-6 pt-2">
        <div className="rounded-xl border border-border/20 bg-secondary/30 p-8 text-center">
          <p className="text-xs text-muted-foreground/60">Nenhuma programação disponível hoje</p>
        </div>
      </div>
    );
  }

  const banner = validBanners[current];

  return (
    <section className="relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {banner.link_url ? (
              <a href={banner.link_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={banner.image_url}
                  alt={banner.title || "Programação do dia"}
                  className="w-full h-[65vh] sm:h-[60vh] object-cover"
                  loading="eager"
                  onError={() => setImgErrors((prev) => new Set(prev).add(banner.id))}
                />
              </a>
            ) : (
              <img
                src={banner.image_url}
                alt={banner.title || "Programação do dia"}
                className="w-full h-[65vh] sm:h-[60vh] object-cover"
                loading="eager"
                onError={() => setImgErrors((prev) => new Set(prev).add(banner.id))}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Deep gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent pointer-events-none" />

        {/* Title */}
        {banner.title && (
          <div className="absolute bottom-12 left-4 right-4 sm:left-6 sm:right-6 pointer-events-none">
            <p className="text-base sm:text-xl font-bold text-foreground drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] line-clamp-2">
              {banner.title}
            </p>
          </div>
        )}

        {/* Progress indicators */}
        {validBanners.length > 1 && (
          <div className="absolute bottom-3 left-4 right-4 sm:left-6 sm:right-6 flex gap-1.5">
            {validBanners.map((_, i) => (
              <div key={i} className="flex-1 h-[3px] rounded-full bg-foreground/25 overflow-hidden">
                <div
                  className="h-full rounded-full bg-foreground/90 transition-all duration-100 ease-linear"
                  style={{
                    width: i === current ? `${progress}%` : i < current ? "100%" : "0%",
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop arrows */}
      {validBanners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 rounded-full glass-card p-2 text-foreground opacity-0 hover:opacity-100 transition-all min-h-[44px] min-w-[44px] items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 rounded-full glass-card p-2 text-foreground opacity-0 hover:opacity-100 transition-all min-h-[44px] min-w-[44px] items-center justify-center"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </section>
  );
};
