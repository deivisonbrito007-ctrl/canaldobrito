import { useDailyBanners } from "@/hooks/useDailyBanners";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
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
    const duration = 7000;
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
    return <Skeleton className="w-full h-[80vh] sm:h-[75vh]" />;
  }

  if (validBanners.length === 0) {
    return (
      <div className="px-4 sm:px-6 pt-4">
        <div className="rounded-2xl border border-border/10 bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground/50">Nenhuma programação disponível hoje</p>
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
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {banner.link_url ? (
              <a href={banner.link_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={banner.image_url}
                  alt={banner.title || "Programação do dia"}
                  className="w-full h-[80vh] sm:h-[75vh] object-cover"
                  loading="eager"
                  onError={() => setImgErrors((prev) => new Set(prev).add(banner.id))}
                />
              </a>
            ) : (
              <img
                src={banner.image_url}
                alt={banner.title || "Programação do dia"}
                className="w-full h-[80vh] sm:h-[75vh] object-cover"
                loading="eager"
                onError={() => setImgErrors((prev) => new Set(prev).add(banner.id))}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Deep cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent pointer-events-none" />

        {/* Content overlay */}
        <div className="absolute bottom-16 left-5 right-5 sm:left-8 sm:right-8 pointer-events-none space-y-4">
          {banner.title && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <p className="text-2xl sm:text-4xl font-extrabold text-foreground leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] max-w-xl line-clamp-2">
                {banner.title}
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="pointer-events-auto"
          >
            <a
              href={banner.link_url || "#assista"}
              target={banner.link_url ? "_blank" : undefined}
              rel={banner.link_url ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-lg transition-all duration-200 glow-primary shadow-lg"
            >
              <Play className="h-4 w-4 fill-current" />
              Ver Programação
            </a>
          </motion.div>
        </div>

        {/* Progress indicators */}
        {validBanners.length > 1 && (
          <div className="absolute bottom-4 left-5 right-5 sm:left-8 sm:right-8 flex gap-1.5">
            {validBanners.map((_, i) => (
              <div key={i} className="flex-1 h-[3px] rounded-full bg-foreground/15 overflow-hidden">
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
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-card/60 backdrop-blur-md border border-border/10 p-2.5 text-foreground opacity-0 hover:opacity-100 transition-all duration-300 min-h-[44px] min-w-[44px] items-center justify-center hover:bg-card/80"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-card/60 backdrop-blur-md border border-border/10 p-2.5 text-foreground opacity-0 hover:opacity-100 transition-all duration-300 min-h-[44px] min-w-[44px] items-center justify-center hover:bg-card/80"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </section>
  );
};
