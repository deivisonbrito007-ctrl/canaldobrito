import { useBanners, BANNER_CATEGORIES, type BannerCategory } from "@/hooks/useBanners";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BannerSectionProps {
  category: BannerCategory;
  label: string;
  icon: string;
}

const BannerSection = ({ category, label, icon }: BannerSectionProps) => {
  const { data: banners = [] } = useBanners(category, true);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    containScroll: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setProgress(0);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  // Auto-play with progress bar
  useEffect(() => {
    if (!emblaApi || banners.length <= 1 || isPaused) return;
    const duration = 5000;
    const step = 50;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += step;
      setProgress((elapsed / duration) * 100);
      if (elapsed >= duration) {
        emblaApi.scrollNext();
        elapsed = 0;
        setProgress(0);
      }
    }, step);

    return () => clearInterval(interval);
  }, [emblaApi, banners.length, isPaused, selectedIndex]);

  if (banners.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-2"
    >
      {/* Section header */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-base">{icon}</span>
        <h2 className="font-display text-sm sm:text-base font-bold text-foreground">{label}</h2>
        {banners.length > 1 && (
          <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
            {selectedIndex + 1}/{banners.length}
          </span>
        )}
      </div>

      <div
        className="relative group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div ref={emblaRef} className="overflow-hidden rounded-2xl">
          <div className="flex">
            {banners.map((banner, idx) => (
              <div
                key={banner.id}
                className="relative min-w-0 shrink-0 grow-0 basis-full"
              >
                <div className="relative aspect-[16/9] sm:aspect-[2/1] overflow-hidden bg-secondary">
                  <img
                    src={banner.image_url}
                    alt={banner.title || label}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/20 to-transparent" />

                  {/* Title overlay */}
                  {banner.title && (
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-sm sm:text-base font-bold text-foreground drop-shadow-lg line-clamp-2">
                        {banner.title}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        {banners.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted-foreground/10 rounded-b-2xl overflow-hidden">
            <motion.div
              className="h-full bg-primary/80"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.05, ease: "linear" }}
            />
          </div>
        )}

        {/* Nav arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={() => emblaApi?.scrollPrev()}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/70 text-foreground opacity-0 backdrop-blur-md transition-all group-hover:opacity-100 hover:bg-background/90 active:scale-90"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/70 text-foreground opacity-0 backdrop-blur-md transition-all group-hover:opacity-100 hover:bg-background/90 active:scale-90"
              aria-label="Próximo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 rounded-full bg-background/50 px-2.5 py-1 backdrop-blur-md">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => emblaApi?.scrollTo(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  idx === selectedIndex
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-foreground/30 hover:bg-foreground/50"
                )}
                aria-label={`Ir para slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
};

export const BannerCarousel = () => {
  const { data: allBanners = [], isLoading } = useBanners("all", true);

  // Group banners by category and render sections that have banners
  const sections = useMemo(() => {
    const categoriesWithBanners = new Set(allBanners.map((b) => b.category));
    return BANNER_CATEGORIES.filter((cat) => categoriesWithBanners.has(cat.value));
  }, [allBanners]);

  if (isLoading || sections.length === 0) return null;

  return (
    <div className="space-y-5">
      {sections.map((section, idx) => (
        <BannerSection
          key={section.value}
          category={section.value}
          label={section.label}
          icon={section.icon}
        />
      ))}
    </div>
  );
};
