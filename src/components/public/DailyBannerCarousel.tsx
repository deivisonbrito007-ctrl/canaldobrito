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

  const validBanners = banners?.filter((b) => !imgErrors.has(b.id)) || [];

  const next = useCallback(() => {
    if (validBanners.length > 1) setCurrent((c) => (c + 1) % validBanners.length);
  }, [validBanners.length]);

  const prev = useCallback(() => {
    if (validBanners.length > 1) setCurrent((c) => (c - 1 + validBanners.length) % validBanners.length);
  }, [validBanners.length]);

  useEffect(() => {
    if (validBanners.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, validBanners.length]);

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
      <section className="space-y-3 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">📺</span>
          <h2 className="font-display text-sm sm:text-base font-bold text-foreground tracking-tight">Programação do Dia</h2>
        </div>
        <Skeleton className="w-full aspect-video rounded-2xl" />
      </section>
    );
  }

  if (validBanners.length === 0) {
    return (
      <section className="px-4 sm:px-6">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="text-lg">📺</span>
          <h2 className="font-display text-sm sm:text-base font-bold text-foreground tracking-tight">Programação do Dia</h2>
        </div>
        <div className="rounded-2xl border border-border/20 bg-secondary/30 p-8 text-center">
          <p className="text-sm text-muted-foreground/60">Nenhuma programação disponível hoje</p>
        </div>
      </section>
    );
  }

  const banner = validBanners[current];

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5 px-4 sm:px-6">
        <span className="text-lg">📺</span>
        <h2 className="font-display text-sm sm:text-base font-bold text-foreground tracking-tight">Programação do Dia</h2>
        <span className="text-[10px] text-muted-foreground/50 bg-secondary/60 rounded-full px-2 py-0.5 font-medium">
          {validBanners.length}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-border/30 to-transparent" />
      </div>

      <div className="relative group" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="overflow-hidden sm:rounded-2xl sm:mx-4 premium-shadow">
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
                    className="w-full h-[60vh] object-cover"
                    loading="lazy"
                    onError={() => setImgErrors((prev) => new Set(prev).add(banner.id))}
                  />
                </a>
              ) : (
                <img
                  src={banner.image_url}
                  alt={banner.title || "Programação do dia"}
                  className="w-full aspect-video object-cover"
                  loading="lazy"
                  onError={() => setImgErrors((prev) => new Set(prev).add(banner.id))}
                />
              )}
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />

          {banner.title && (
            <div className="absolute bottom-8 left-4 right-4 pointer-events-none">
              <p className="text-sm sm:text-base font-bold text-foreground drop-shadow-lg">{banner.title}</p>
            </div>
          )}
        </div>

        {validBanners.length > 1 && (
          <>
            <button
              onClick={prev}
              className="hidden sm:flex absolute left-6 top-1/2 -translate-y-1/2 rounded-full glass-card p-2.5 text-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-card/80 min-h-[44px] min-w-[44px] items-center justify-center"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2 rounded-full glass-card p-2.5 text-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-card/80 min-h-[44px] min-w-[44px] items-center justify-center"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {validBanners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {validBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 min-h-[16px] min-w-[16px] flex items-center justify-center ${
                  i === current
                    ? "w-6 h-2 bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
                    : "w-2 h-2 bg-foreground/25 hover:bg-foreground/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
