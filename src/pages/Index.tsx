import { useState, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppNavbar } from "@/components/public/AppNavbar";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/public/PullToRefreshIndicator";
import { Hero } from "@/components/public/Hero";
import { CategoryIconsCarousel } from "@/components/public/CategoryIconsCarousel";
import { LiveNowHero } from "@/components/public/LiveNowHero";
import { PublicFooter } from "@/components/public/PublicFooter";
import { BottomNav } from "@/components/public/BottomNav";
import { SectionHeaderSkeleton, PosterRowSkeleton, GameCardSkeleton, NewsBannerSkeleton } from "@/components/public/ContentSkeletons";

const HighlightsTab = lazy(() => import("@/components/public/HighlightsTab"));
const ScheduleTab = lazy(() => import("@/components/public/ScheduleTab"));
const LazyNovidadesCard = lazy(() => import("@/components/public/NovidadesCard").then(m => ({ default: m.NovidadesCard })));
const LazyPromoStrip = lazy(() => import("@/components/public/PromoStrip").then(m => ({ default: m.PromoStrip })));
const LazyBannerSections = lazy(() => import("@/components/public/BannerSections").then(m => ({ default: m.BannerSections })));
const LazyWeeklyMovies = lazy(() => import("@/components/public/WeeklyMoviesSection").then(m => ({ default: m.WeeklyMoviesSection })));
const LazyWeeklySeries = lazy(() => import("@/components/public/WeeklySeriesSection").then(m => ({ default: m.WeeklySeriesSection })));

const HighlightsFallback = () => (
  <div className="pt-5 pb-3 space-y-6">
    <div className="px-4"><SectionHeaderSkeleton /></div>
    <PosterRowSkeleton />
    <div className="px-4"><SectionHeaderSkeleton /></div>
    <PosterRowSkeleton />
  </div>
);

const ScheduleFallback = () => (
  <div className="px-4 pt-5 pb-3 space-y-5">
    <SectionHeaderSkeleton />
    {[0, 1, 2].map((i) => <GameCardSkeleton key={i} index={i} />)}
  </div>
);

const BelowFoldSkeleton = () => (
  <div className="space-y-5 px-4" style={{ minHeight: 560 }}>
    <NewsBannerSkeleton />
    <div className="rounded-xl skeleton-shimmer h-[88px]" />
  </div>
);

const TAB_ORDER = ["home", "highlights", "schedule"] as const;

const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const Index = () => {
  const mainRef = useRef<HTMLElement>(null);
  const [activeTab, setActiveTab] = useState("home");
  const { pullDistance, isRefreshing } = usePullToRefresh(mainRef);

  

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Listen for nav-tab-change events from other components
  useEffect(() => {
    const handler = (e: Event) => {
      const tabId = (e as CustomEvent).detail;
      if (TAB_ORDER.includes(tabId)) {
        handleTabChange(tabId);
      }
    };
    window.addEventListener("nav-tab-change", handler);
    return () => window.removeEventListener("nav-tab-change", handler);
  }, [handleTabChange]);

  const renderContent = () => {
    if (activeTab === "highlights") {
      return (
        <Suspense fallback={<HighlightsFallback />}>
          <HighlightsTab />
        </Suspense>
      );
    }
    if (activeTab === "schedule") {
      return (
        <Suspense fallback={<ScheduleFallback />}>
          <ScheduleTab />
        </Suspense>
      );
    }
    return (
      <div className="space-y-5 min-h-[80vh]">
        <Hero />
        <CategoryIconsCarousel />
        <LiveNowHero />
        <Suspense fallback={<BelowFoldSkeleton />}>
          <LazyNovidadesCard />
          <LazyPromoStrip />
          <LazyWeeklyMovies />
          <LazyWeeklySeries />
          <LazyBannerSections />
        </Suspense>
      </div>
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-x-hidden">
      {/* Ambient green blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full animate-blob-a atm-blob"
          style={{ background: "radial-gradient(circle, hsl(153 100% 50% / 0.06), transparent 70%)" }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-[240px] h-[240px] rounded-full animate-blob-b atm-blob"
          style={{ background: "radial-gradient(circle, hsl(153 100% 50% / 0.04), transparent 70%)" }}
        />
      </div>

      {/* Grain */}
      <div className="grain-overlay" />

      <AppNavbar />

      <main ref={mainRef} className="relative z-10 flex-1" style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom, 0px))", overscrollBehaviorY: "contain" }}>
        <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.15 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <PublicFooter />
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Index;
