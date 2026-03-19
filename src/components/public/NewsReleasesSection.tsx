import { useActiveNewsReleases } from "@/hooks/useNewsReleases";
import { Sparkles, Star, ImageOff, Clock, Tv } from "lucide-react";
import { NewsBannerSkeleton, SectionHeaderSkeleton } from "./ContentSkeletons";
import { AnimatePresence, motion } from "framer-motion";
import { SectionHeader } from "./SectionHeader";
import { ContentDetailSheet } from "./ContentDetailSheet";
import { useState, useEffect, useCallback, useRef } from "react";

const formatRuntime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};

export const NewsReleasesSection = () => {
  const { data: items, isLoading } = useActiveNewsReleases();
  const [current, setCurrent] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<typeof items extends (infer T)[] | undefined ? T | null : never>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const touchRef = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = items?.length ?? 0;

  useEffect(() => {
    setCurrent(0);
  }, [total]);

  const safeIndex = total > 0 ? Math.min(current, total - 1) : 0;

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % (total || 1));
    }, 4000);
  }, [total]);

  useEffect(() => {
    if (total > 1) startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [total, startTimer]);

  const goTo = (i: number) => {
    setCurrent(i);
    startTimer();
  };

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
      setCurrent((c) => diff < 0 ? (c + 1) % total : (c - 1 + total) % total);
    }
    touchRef.current = null;
    startTimer();
  };

  const handleCardClick = () => {
    if (didSwipe.current) return;
    const current_item = items?.[safeIndex];
    if (!current_item) return;
    setSelectedItem(current_item);
    setSheetOpen(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setSelectedItem(null);
    if (total > 1) startTimer();
  };

  if (isLoading) {
    return (
      <div className="px-4 space-y-4">
        <SectionHeaderSkeleton />
        <NewsBannerSkeleton />
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  const item = items[safeIndex];
  if (!item) return null;

  const hasImg = item.image_url && !imgErrors.has(item.id);

  return (
    <div className="space-y-4">
      <div className="px-4 sm:px-6">
        <SectionHeader icon={Sparkles} title="Novidades" subtitle="Filmes e séries em destaque" />
      </div>

      <div
        className="relative mx-4 h-[360px] sm:h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Background */}
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {hasImg ? (
              <>
                <img
                  src={item.image_url!}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60"
                  aria-hidden="true"
                />
                <img
                  src={item.image_url!}
                  alt={item.title}
                  className="relative w-full h-full object-contain z-[1]"
                  onError={() => setImgErrors((s) => new Set(s).add(item.id))}
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-card">
                <ImageOff className="h-10 w-10 text-muted-foreground/20" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

        {/* Badge top-left */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm ${
              item.badge_type === "lancamento" ? "bg-purple-500/70" :
              item.badge_type === "nova_temporada" ? "bg-blue-500/70" :
              item.badge_type === "estreia" ? "bg-emerald-500/70" :
              item.badge_type === "exclusivo" ? "bg-amber-500/70" :
              "bg-orange-500/70"
            }`}
          >
            {item.badge_type === "lancamento" ? "🆕 Lançamento" :
             item.badge_type === "nova_temporada" ? "📺 Nova Temporada" :
             item.badge_type === "estreia" ? "⭐ Estreia" :
             item.badge_type === "exclusivo" ? "👑 Exclusivo" : "🔥 Novidade"}
          </span>
        </div>

        {/* Rating top-right */}
        {item.rating && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-lg bg-black/40 backdrop-blur-md border border-accent3/20 px-2 py-1">
            <Star className="h-3 w-3 text-accent3 fill-accent3" />
            <span className="text-[11px] font-bold text-accent3">
              {item.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Content bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 space-y-2 z-10">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white leading-tight line-clamp-2 drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
            {item.title}
          </h2>

          {item.tagline && (
            <p className="text-[11px] italic text-white/60 drop-shadow-md line-clamp-1">
              "{item.tagline}"
            </p>
          )}

          {/* Meta line: type · year · runtime/seasons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-full bg-white/15 border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-white/85 backdrop-blur-sm">
              {item.content_type === "movie" ? "🎬 Filme" : "📺 Série"}
              {item.year ? ` · ${item.year}` : ""}
            </span>
            {item.runtime && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 border border-white/15 px-3 py-1.5 text-[11px] font-medium text-white/75 backdrop-blur-sm">
                <Clock className="h-3 w-3" />
                {formatRuntime(item.runtime)}
              </span>
            )}
            {item.seasons && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 border border-white/15 px-3 py-1.5 text-[11px] font-medium text-white/75 backdrop-blur-sm">
                <Tv className="h-3 w-3" />
                {item.seasons} temp{item.seasons > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Genres */}
          {item.genres && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.genres.split(", ").slice(0, 3).map((g) => (
                <span key={g} className="rounded-full bg-white/[0.12] px-2.5 py-0.5 text-[11px] font-medium text-white/70">
                  {g}
                </span>
              ))}
            </div>
          )}

          {item.overview && (
            <p className="text-xs text-white/70 leading-relaxed line-clamp-2 max-w-[90%] drop-shadow-md">
              {item.overview}
            </p>
          )}
        </div>

        {/* Slide indicator + Dots */}
        {total > 1 && (
          <div className="absolute bottom-3 right-4 flex items-center gap-2 z-10">
            <span className="text-[10px] font-bold text-white/50">
              {safeIndex + 1}/{total}
            </span>
            <div className="flex gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="p-1.5"
                  aria-label={`Slide ${i + 1}`}
                >
                  <span
                    className={`block rounded-full transition-all duration-300 ${
                      i === safeIndex
                        ? "w-5 h-2 bg-primary"
                        : "w-2 h-2 bg-white/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
