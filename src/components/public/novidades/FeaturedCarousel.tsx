import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ImageOff, Info, Play, Star } from "lucide-react";
import { BadgePill } from "./BadgePill";
import { useTrailerAvailability } from "@/hooks/useTrailerAvailability";
import { useTrailerKey } from "@/hooks/useTrailerKey";
import { TrailerModal } from "@/components/public/TrailerModal";
import { trackContentClick } from "@/lib/analytics";
import type { NewsRelease } from "@/hooks/useNewsReleases";

interface FeaturedCarouselProps {
  items: NewsRelease[];
  onSelect: (item: NewsRelease) => void;
}

export const FeaturedCarousel = ({ items, onSelect }: FeaturedCarouselProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [trailerItem, setTrailerItem] = useState<NewsRelease | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const didSwipe = useRef(false);

  const total = items.length;
  const safeIndex = total > 0 ? Math.min(current, total - 1) : 0;
  const item = items[safeIndex];

  const availabilityItems = items.map((i) => ({ tmdb_id: i.tmdb_id, content_type: i.content_type }));
  const { available: trailerMap } = useTrailerAvailability(availabilityItems);
  const { trailerKey, loading: trailerLoading } = useTrailerKey(
    trailerItem?.tmdb_id,
    trailerItem?.content_type,
    !!trailerItem,
  );
  const hasTrailer = !!item?.tmdb_id && trailerMap.get(item.tmdb_id) === true;

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (total <= 1) return;
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % total);
    }, 5000);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  // Prefetch neighbour images
  useEffect(() => {
    if (total <= 1) return;
    const neighbours = [items[(safeIndex + 1) % total], items[(safeIndex - 1 + total) % total]];
    const links: HTMLLinkElement[] = [];
    neighbours.forEach((it) => {
      const url = it?.backdrop_url || it?.image_url;
      if (!url) return;
      const link = document.createElement("link");
      link.rel = "preload"; link.as = "image"; link.href = url;
      document.head.appendChild(link); links.push(link);
    });
    return () => { links.forEach((l) => l.parentNode?.removeChild(l)); };
  }, [items, safeIndex, total]);

  const goTo = (i: number, dir?: number) => {
    setDirection(dir ?? (i > safeIndex ? 1 : -1));
    setCurrent(i);
    startTimer();
  };
  const prev = () => goTo((safeIndex - 1 + total) % total, -1);
  const next = () => goTo((safeIndex + 1) % total, 1);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    didSwipe.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 50 && Math.abs(dx) > dy) {
      didSwipe.current = true;
      if (dx < 0) next(); else prev();
    } else {
      startTimer();
    }
    touchStartX.current = null; touchStartY.current = null;
  };

  const handleCardClick = () => {
    if (didSwipe.current || !item) return;
    trackContentClick({
      surface: "novidades_featured",
      content_type: item.content_type ?? "news",
      content_id: item.tmdb_id ?? item.id,
      content_title: item.title,
      position: safeIndex,
      action: "open",
    });
    onSelect(item);
  };

  const handleTrailerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item?.tmdb_id) return;
    setTrailerItem(item);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  if (!item) return null;

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 40, scale: 0.98 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -40, scale: 0.98 }),
  };

  const backdrop = item.backdrop_url || item.image_url;

  return (
    <section className="space-y-3">
      <div className="px-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground font-body">
          🔥 Em Destaque
        </h2>
        {total > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground tabular-nums mr-1 font-body">
              {safeIndex + 1}/{total}
            </span>
            <button
              onClick={prev}
              aria-label="Anterior"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-2 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors min-h-[44px] min-w-[44px]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              aria-label="Próximo"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-2 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors min-h-[44px] min-w-[44px]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div
        className="relative h-[420px] rounded-2xl overflow-hidden mx-4 bg-surface-2 border border-border cursor-pointer group"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={handleCardClick}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={item.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0"
          >
            {backdrop ? (
              <img src={backdrop} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" decoding="async" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
                <ImageOff className="w-10 h-10 text-muted-foreground/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-transparent" />

            <div className="absolute inset-0 flex flex-col justify-end p-5 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <BadgePill type={item.badge_type} />
                <BadgePill type={item.content_type} />
                {item.rating != null && item.rating > 0 && (
                  <span className="inline-flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/40 px-2 py-1 rounded-full">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <span className="text-[10px] font-bold text-yellow-500 tabular-nums">
                      {item.rating.toFixed(1)}
                    </span>
                  </span>
                )}
              </div>

              <h3 className="font-display text-3xl text-foreground leading-none tracking-wide line-clamp-2">
                {item.title.toUpperCase()}
              </h3>

              <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                {item.year && <span>{item.year}</span>}
                {item.genres && (
                  <>
                    <span>•</span>
                    <span className="line-clamp-1">{item.genres.split(",").slice(0, 2).join(", ")}</span>
                  </>
                )}
              </div>

              {item.overview && (
                <p className="text-sm text-muted-foreground font-body line-clamp-2 leading-relaxed">
                  {item.overview}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all min-h-[44px] active:scale-[0.98]"
                >
                  <Info className="w-4 h-4" />
                  Mais Detalhes
                </button>
                {hasTrailer && (
                  <button
                    onClick={handleTrailerClick}
                    aria-label={`Assistir trailer de ${item.title}`}
                    className="flex items-center justify-center w-11 h-11 rounded-xl bg-surface-2/80 backdrop-blur-sm border border-border hover:border-primary/40 transition-colors min-h-[44px] min-w-[44px]"
                  >
                    <Play className="w-4 h-4 fill-current text-foreground" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {total > 1 && (
        <div className="flex justify-center gap-1.5 px-4">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="p-1.5 min-h-[44px] min-w-[28px] flex items-center justify-center"
              aria-label={`Slide ${i + 1}`}
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  i === safeIndex ? "w-6 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      <TrailerModal
        open={!!trailerItem}
        onClose={() => { setTrailerItem(null); startTimer(); }}
        trailerKey={trailerKey}
        loading={trailerLoading}
        title={trailerItem?.title}
      />
    </section>
  );
};
