import { useBanners, BANNER_CATEGORIES } from "@/hooks/useBanners";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export const BannerCarousel = () => {
  const { data: banners = [], isLoading } = useBanners("all", true);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    containScroll: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  // Auto-play with pause on hover
  useEffect(() => {
    if (!emblaApi || banners.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [emblaApi, banners.length, isPaused]);

  if (isLoading || banners.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div ref={emblaRef} className="overflow-hidden rounded-2xl">
        <div className="flex">
          {banners.map((banner, idx) => {
            const cat = BANNER_CATEGORIES.find((c) => c.value === banner.category);
            return (
              <div
                key={banner.id}
                className="relative min-w-0 shrink-0 grow-0 basis-full"
              >
                <div className="relative aspect-[16/9] sm:aspect-[2/1] overflow-hidden bg-secondary">
                  <img
                    src={banner.image_url}
                    alt={banner.title || cat?.label || "Banner"}
                    className="h-full w-full object-cover"
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/80 to-transparent" />
                  {/* Info */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div className="flex items-center gap-2 rounded-full bg-background/70 px-3 py-1.5 backdrop-blur-md">
                      <span className="text-sm">{cat?.icon}</span>
                      <span className="text-xs font-semibold text-foreground">
                        {banner.title || cat?.label}
                      </span>
                    </div>
                    {banners.length > 1 && (
                      <span className="rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-bold text-foreground backdrop-blur-md">
                        {idx + 1}/{banners.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nav arrows - visible on hover (desktop) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-foreground opacity-0 backdrop-blur-md transition-all group-hover:opacity-100 hover:bg-background/90 active:scale-90"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-foreground opacity-0 backdrop-blur-md transition-all group-hover:opacity-100 hover:bg-background/90 active:scale-90"
            aria-label="Próximo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => emblaApi?.scrollTo(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                idx === selectedIndex
                  ? "w-7 bg-primary"
                  : "w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/40"
              )}
              aria-label={`Ir para slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
