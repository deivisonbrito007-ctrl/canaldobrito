import { useBanners, BANNER_CATEGORIES, type BannerCategory } from "@/hooks/useBanners";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const BannerCarousel = () => {
  const { data: banners = [], isLoading } = useBanners("all", true);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    containScroll: "trimSnaps",
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  // Auto-play
  useEffect(() => {
    if (!emblaApi || banners.length <= 1) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [emblaApi, banners.length]);

  if (isLoading || banners.length === 0) return null;

  return (
    <div className="space-y-2">
      <div ref={emblaRef} className="overflow-hidden rounded-xl">
        <div className="flex">
          {banners.map((banner) => {
            const cat = BANNER_CATEGORIES.find((c) => c.value === banner.category);
            return (
              <div
                key={banner.id}
                className="relative min-w-0 shrink-0 grow-0 basis-full"
              >
                <div className="relative aspect-[16/9] sm:aspect-[21/9] overflow-hidden rounded-xl">
                  <img
                    src={banner.image_url}
                    alt={banner.title || cat?.label || "Banner"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {/* Category badge */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 backdrop-blur-sm">
                    <span className="text-sm">{cat?.icon}</span>
                    <span className="text-xs font-medium text-foreground">
                      {banner.title || cat?.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => emblaApi?.scrollTo(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                idx === selectedIndex
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-muted-foreground/30"
              )}
              aria-label={`Ir para slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
