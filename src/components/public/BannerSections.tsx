import { useBannersByCategory, type BannerCategory } from "@/hooks/useBanners";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SPORTS_CATEGORIES: { key: BannerCategory; emoji: string; label: string }[] = [
  { key: "football", emoji: "⚽", label: "Futebol" },
  { key: "basketball", emoji: "🏀", label: "Basquete" },
  { key: "ufc", emoji: "🥊", label: "UFC/MMA" },
  { key: "other_sports", emoji: "🏆", label: "Outros" },
];

const CategoryCarousel = ({ category }: { category: BannerCategory }) => {
  const { data: banners, isLoading } = useBannersByCategory(category);
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
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, validBanners.length]);

  useEffect(() => { setCurrent(0); }, [category]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { startX: e.touches[0].clientX };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); }
    touchRef.current = null;
  };

  if (isLoading) return <Skeleton className="w-full aspect-video rounded-2xl mx-4" />;
  if (validBanners.length === 0) return null;

  const banner = validBanners[current];

  return (
    <div className="relative group" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="overflow-hidden rounded-2xl mx-4 sm:mx-6 transition-transform duration-300 group-hover:scale-[1.01]">
        <AnimatePresence mode="wait">
          <motion.div
            key={banner.id}
            className="relative"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <img
              src={banner.image_url}
              alt={banner.title || "Banner"}
              className="w-full aspect-video object-cover"
              loading="lazy"
              onError={() => setImgErrors((prev) => new Set(prev).add(banner.id))}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            {banner.title && (
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-sm sm:text-base font-bold text-foreground drop-shadow-lg line-clamp-2">
                  {banner.title}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {validBanners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="hidden sm:flex absolute left-8 top-1/2 -translate-y-1/2 rounded-full bg-card/60 backdrop-blur-md border border-border/10 p-2 text-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 min-h-[40px] min-w-[40px] items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="hidden sm:flex absolute right-8 top-1/2 -translate-y-1/2 rounded-full bg-card/60 backdrop-blur-md border border-border/10 p-2 text-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 min-h-[40px] min-w-[40px] items-center justify-center"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {validBanners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {validBanners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 min-h-[14px] min-w-[14px] flex items-center justify-center ${
                i === current
                  ? "w-5 h-1.5 bg-primary shadow-[0_0_8px_hsl(142,60%,45%,0.5)]"
                  : "w-1.5 h-1.5 bg-foreground/20 hover:bg-foreground/35"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SportsSection = () => {
  const [activeSport, setActiveSport] = useState<BannerCategory>("football");
  
  // Check which sports have banners
  const footballData = useBannersByCategory("football");
  const basketballData = useBannersByCategory("basketball");
  const ufcData = useBannersByCategory("ufc");
  const otherData = useBannersByCategory("other_sports");

  const dataMap: Record<string, { data: any[] | undefined }> = {
    football: footballData,
    basketball: basketballData,
    ufc: ufcData,
    other_sports: otherData,
  };

  const availableSports = SPORTS_CATEGORIES.filter(
    (s) => (dataMap[s.key]?.data?.length ?? 0) > 0
  );

  if (availableSports.length === 0) return null;

  // If active sport has no data, switch to first available
  if (!availableSports.find((s) => s.key === activeSport) && availableSports.length > 0) {
    return <SportsWithDefault availableSports={availableSports} />;
  }

  return (
    <motion.section
      className="space-y-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2.5 px-4 sm:px-6">
        <span className="text-lg">🏟️</span>
        <h2 className="font-display text-base sm:text-lg font-extrabold text-foreground tracking-tight">Esportes</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-border/20 to-transparent" />
      </div>

      {availableSports.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none px-4 sm:px-6 pb-1">
          {availableSports.map((sport) => (
            <button
              key={sport.key}
              onClick={() => setActiveSport(sport.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[32px] ${
                activeSport === sport.key
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {sport.emoji} {sport.label}
            </button>
          ))}
        </div>
      )}

      <CategoryCarousel category={activeSport} />
    </motion.section>
  );
};

// Helper to auto-select first available sport
const SportsWithDefault = ({ availableSports }: { availableSports: typeof SPORTS_CATEGORIES }) => {
  const [activeSport, setActiveSport] = useState<BannerCategory>(availableSports[0].key);

  return (
    <motion.section
      className="space-y-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2.5 px-4 sm:px-6">
        <span className="text-lg">🏟️</span>
        <h2 className="font-display text-base sm:text-lg font-extrabold text-foreground tracking-tight">Esportes</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-border/20 to-transparent" />
      </div>

      {availableSports.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none px-4 sm:px-6 pb-1">
          {availableSports.map((sport) => (
            <button
              key={sport.key}
              onClick={() => setActiveSport(sport.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[32px] ${
                activeSport === sport.key
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {sport.emoji} {sport.label}
            </button>
          ))}
        </div>
      )}

      <CategoryCarousel category={activeSport} />
    </motion.section>
  );
};

const FootballGuideSection = () => {
  const { data: banners } = useBannersByCategory("football_guide");
  if (!banners || banners.length === 0) return null;

  return (
    <motion.section
      className="space-y-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2.5 px-4 sm:px-6">
        <span className="text-lg">📋</span>
        <h2 className="font-display text-base sm:text-lg font-extrabold text-foreground tracking-tight">Guia do Futebol</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-border/20 to-transparent" />
      </div>
      <CategoryCarousel category="football_guide" />
    </motion.section>
  );
};

export const BannerSections = () => {
  return (
    <div className="space-y-12">
      <SportsSection />
      <FootballGuideSection />
    </div>
  );
};
