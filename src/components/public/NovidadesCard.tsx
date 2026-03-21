import { useActiveNewsReleases } from "@/hooks/useNewsReleases";
import { ContentDetailSheet } from "./ContentDetailSheet";
import { useState, useEffect, useCallback, useRef } from "react";
import { ImageOff, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const getBadgeLabel = (badge_type: string) => {
  if (badge_type === "lancamento") return "🆕 Lançamento";
  if (badge_type === "nova_temporada") return "📺 Nova Temporada";
  if (badge_type === "estreia") return "⭐ Estreia";
  if (badge_type === "exclusivo") return "👑 Exclusivo";
  return "🔥 Novidade";
};

export const NovidadesCard = () => {
  const { data: items, isLoading } = useActiveNewsReleases();
  const [current, setCurrent] = useState(0);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchRef = useRef<number | null>(null);
  const didSwipe = useRef(false);

  const total = items?.length ?? 0;

  useEffect(() => { setCurrent(0); }, [total]);

  const safeIndex = total > 0 ? Math.min(current, total - 1) : 0;

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % (total || 1));
    }, 5000);
  }, [total]);

  useEffect(() => {
    if (total > 1) startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [total, startTimer]);

  const goTo = (i: number) => {
    setCurrent(i);
    startTimer();
  };

  const prev = () => goTo((safeIndex - 1 + total) % total);
  const next = () => goTo((safeIndex + 1) % total);

  const onTouchStart = (e: React.TouchEvent) => {
    touchRef.current = e.touches[0].clientX;
    didSwipe.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchRef.current;
    if (Math.abs(diff) > 50) {
      didSwipe.current = true;
      if (diff < 0) next(); else prev();
    } else {
      startTimer();
    }
    touchRef.current = null;
  };

  const handleCardClick = () => {
    if (didSwipe.current) return;
    const clickedItem = items?.[safeIndex];
    if (!clickedItem) return;
    setSelectedItem(clickedItem);
    setSheetOpen(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setSelectedItem(null);
    if (total > 1) startTimer();
  };

  if (isLoading || !items || items.length === 0) return null;

  const item = items[safeIndex];
  if (!item) return null;

  return (
    <section className="px-4 animate-fade-up stagger-6 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground font-body">
          Novidades <span className="text-primary">Canal do Brito</span>
        </h3>
        {total > 1 && (
          <span className="text-[10px] text-muted-foreground font-body tabular-nums">
            {safeIndex + 1}/{total}
          </span>
        )}
      </div>

      <div
        className="relative rounded-2xl overflow-hidden bg-surface border border-border cursor-pointer transition-all duration-200 hover:border-primary/20"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={handleCardClick}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto]">
              {/* Content left */}
              <div className="p-5 space-y-3 flex flex-col justify-center">
                <span className="inline-flex self-start items-center rounded-full bg-green-dim border border-green-border px-2.5 py-1 text-[10px] font-bold text-primary font-body">
                  {getBadgeLabel(item.badge_type)}
                </span>

                <h3 className="font-display text-3xl sm:text-4xl text-foreground leading-none tracking-wide">
                  {item.title.toUpperCase()}
                </h3>

                {item.overview && (
                  <p className="text-xs text-muted-foreground font-body line-clamp-2 leading-relaxed max-w-md">
                    {item.overview}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button className="bg-primary text-primary-foreground text-[11px] font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-body">
                    Assistir agora
                  </button>
                  <button className="border border-border text-foreground text-[11px] font-bold px-4 py-2 rounded-lg hover:bg-surface-2 transition-colors font-body">
                    + Minha lista
                  </button>
                </div>
              </div>

              {/* Poster right */}
              <div className="relative w-full sm:w-[220px] min-h-[180px] sm:min-h-[280px] overflow-hidden">
                <span className="absolute inset-0 flex items-center justify-center font-display text-[100px] text-foreground/[0.04] leading-none select-none pointer-events-none">
                  {item.title.split(" ")[0]}
                </span>

                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-contain z-[1]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageOff className="h-10 w-10 text-muted-foreground/20" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Arrow buttons (desktop) */}
        {total > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-background/60 border border-border backdrop-blur-sm text-foreground hover:bg-background/80 transition-colors z-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-background/60 border border-border backdrop-blur-sm text-foreground hover:bg-background/80 transition-colors z-10"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {total > 1 && (
        <div className="flex justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="p-1"
              aria-label={`Slide ${i + 1}`}
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  i === safeIndex
                    ? "w-5 h-1.5 bg-primary"
                    : "w-1.5 h-1.5 bg-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      <ContentDetailSheet
        open={sheetOpen}
        onClose={handleSheetClose}
        item={selectedItem ? {
          title: selectedItem.title,
          overview: selectedItem.overview,
          poster_url: selectedItem.image_url,
          rating: selectedItem.rating,
          year: selectedItem.year,
          genre: selectedItem.genres,
          tmdb_id: selectedItem.tmdb_id,
          content_type: selectedItem.content_type,
        } : null}
      />
    </section>
  );
};
