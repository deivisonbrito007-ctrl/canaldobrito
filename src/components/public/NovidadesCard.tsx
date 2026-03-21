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
  const [direction, setDirection] = useState(1);
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
      setDirection(1);
      setCurrent((c) => (c + 1) % (total || 1));
    }, 5000);
  }, [total]);

  useEffect(() => {
    if (total > 1) startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [total, startTimer]);

  const goTo = (i: number, dir?: number) => {
    setDirection(dir ?? (i > safeIndex ? 1 : -1));
    setCurrent(i);
    startTimer();
  };

  const prev = () => goTo((safeIndex - 1 + total) % total, -1);
  const next = () => goTo((safeIndex + 1) % total, 1);

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

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 40, scale: 0.98 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -40, scale: 0.98 }),
  };

  return (
    <section className="px-4 animate-fade-up stagger-6 space-y-3">
      {/* Header with arrows */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground font-body">
          Novidades <span className="text-primary">Canal do Brito</span>
        </h3>
        {total > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground font-body tabular-nums mr-1">
              {safeIndex + 1}/{total}
            </span>
            <button
              onClick={prev}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-surface border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-surface border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Próximo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Card — stacked on mobile, side-by-side on desktop */}
      <div
        className="relative rounded-2xl overflow-hidden bg-surface border border-border cursor-pointer transition-all duration-200 active:scale-[0.99]"
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
          >
            {/* Mobile: cinematic overlay | Desktop: side-by-side */}
            <div className="relative sm:grid sm:grid-cols-[1fr_260px]">
              {/* Poster */}
              <div className="relative h-[280px] sm:h-auto sm:min-h-[300px] overflow-hidden sm:order-2 bg-surface">
                {/* Gradient left fade (desktop) */}
                <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-surface to-transparent z-[2] hidden sm:block" />

                {item.image_url ? (
                  <motion.img
                    src={item.image_url}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-contain object-top sm:object-contain sm:object-center z-[1]"
                    initial={{ scale: 1.06, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
                    <ImageOff className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                )}

                {/* Mobile: gradient overlay + content on top of poster */}
                <div className="absolute inset-x-0 bottom-0 z-[3] sm:hidden">
                  <div className="h-40 bg-gradient-to-t from-surface via-surface/80 to-transparent" />
                  <div className="bg-surface px-4 pb-4 -mt-px space-y-2.5">
                    <span className="inline-flex items-center rounded-full bg-green-dim border border-green-border px-2.5 py-1 text-[10px] font-bold text-primary font-body">
                      {getBadgeLabel(item.badge_type)}
                    </span>
                    <h3 className="font-display text-2xl text-foreground leading-none tracking-wide">
                      {item.title.toUpperCase()}
                    </h3>
                    {item.overview && (
                      <p className="text-[11px] text-muted-foreground font-body line-clamp-2 leading-relaxed">
                        {item.overview}
                      </p>
                    )}
                    <div className="flex gap-2 pt-0.5">
                      <button className="bg-primary text-primary-foreground text-[11px] font-bold px-4 py-2.5 rounded-full hover:opacity-90 transition-opacity font-body min-h-[44px]">
                        Assistir agora
                      </button>
                      <button className="border border-border text-foreground text-[11px] font-bold px-4 py-2.5 rounded-full hover:bg-surface-2 transition-colors font-body min-h-[44px]">
                        + Minha lista
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop content — left side */}
              <div className="hidden sm:flex p-4 sm:py-8 sm:pl-7 sm:pr-4 space-y-3 flex-col justify-center sm:order-1">
                <span className="inline-flex self-start items-center rounded-full bg-green-dim border border-green-border px-2.5 py-1 text-[10px] font-bold text-primary font-body">
                  {getBadgeLabel(item.badge_type)}
                </span>
                <h3 className="font-display text-4xl text-foreground leading-none tracking-wide">
                  {item.title.toUpperCase()}
                </h3>
                {item.overview && (
                  <p className="text-xs text-muted-foreground font-body line-clamp-2 leading-relaxed">
                    {item.overview}
                  </p>
                )}
                <div className="flex gap-2 pt-0.5">
                  <button className="bg-primary text-primary-foreground text-[11px] font-bold px-4 py-2.5 rounded-full hover:opacity-90 transition-opacity font-body min-h-[44px]">
                    Assistir agora
                  </button>
                  <button className="border border-border text-foreground text-[11px] font-bold px-4 py-2.5 rounded-full hover:bg-surface-2 transition-colors font-body min-h-[44px]">
                    + Minha lista
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      {total > 1 && (
        <div className="flex justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="p-1.5 min-h-[44px] min-w-[28px] flex items-center justify-center"
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
