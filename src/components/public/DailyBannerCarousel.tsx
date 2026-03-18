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

  // Auto-play with progress bar
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
    return (
      <section className="px-3 sm:px-6 pt-2">
        <Skeleton className="w-full h-[50vh] sm:h-[60vh] rounded-xl" />
      </section>
    );
  }

  if (validBanners.length === 0) {
    return (
      <section className="px-3 sm:px-6 pt-2">
        <div className="rounded-xl border border-border/20 bg-secondary/30 p-8 text-center">
          <p className="text-xs text-muted-foreground/60">Nenhuma programação disponível hoje</p>
        </div>
      </section>
    );
  }

  const banner = validBanners[current];

  return (
    <section className="pt-2">
      <div className="relative group mx-3 sm:mx-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="overflow-hidden rounded-xl sm:rounded-2xl premium-shadow">
          <AnimatePresence mode="wait">
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {banner.link_url ? (
                <a href={banner.link_url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={banner.image_url}
                    alt={banner.title || "Programação do dia"}
                    className="w-full h-[50vh] sm:h-[55vh] object-cover"
                    loading="lazy"
                    onError={() => setImgErrors((prev) => new Set(prev).add(banner.id))}
                  />
                </a>
              ) : (
                <img
                  src={banner.image_url}
                  alt={banner.title || "Programação do dia"}
                  className="w-full h-[50vh] sm:h-[55vh] object-cover"
                  loading="lazy"
                  onError={() => setImgErrors((prev) => new Set(prev).add(banner.id))}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80 pointer-events-none" />

          {/* Title */}
          {banner.title && (
            <div className="absolute bottom-10 left-3 right-3 sm:left-4 sm:right-4 pointer-events-none">
              <p className="text-sm sm:text-base font-bold text-foreground drop-shadow-lg line-clamp-2">{banner.title}</p>
            </div>
          )}

          {/* Progress bar */}
          {validBanners.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 flex gap-1 px-3 pb-3">
              {validBanners.map((_, i) => (
                <div key={i} className="flex-1 h-[3px] rounded-full bg-foreground/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground/80 transition-all duration-100 ease-linear"
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
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 rounded-full glass-card p-2 text-foreground opacity-0 group-hover:opacity-100 transition-all min-h-[44px] min-w-[44px] items-center justify-center"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 rounded-full glass-card p-2 text-foreground opacity-0 group-hover:opacity-100 transition-all min-h-[44px] min-w-[44px] items-center justify-center"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </section>
  );
};
