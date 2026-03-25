import { useState, useCallback, useRef, lazy, Suspense } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { AppNavbar } from "@/components/public/AppNavbar";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/public/PullToRefreshIndicator";
import { Hero } from "@/components/public/Hero";
import { CategoryIconsCarousel } from "@/components/public/CategoryIconsCarousel";
import { LiveFeedSection } from "@/components/public/LiveFeedSection";
import { LiveEventsSection } from "@/components/public/LiveEventsSection";
import { PublicFooter } from "@/components/public/PublicFooter";
import { BottomNav } from "@/components/public/BottomNav";
import { SectionHeaderSkeleton, PosterRowSkeleton, GameCardSkeleton, NewsBannerSkeleton } from "@/components/public/ContentSkeletons";

const HighlightsTab = lazy(() => import("@/components/public/HighlightsTab"));
const ScheduleTab = lazy(() => import("@/components/public/ScheduleTab"));
const LazyNovidadesCard = lazy(() => import("@/components/public/NovidadesCard").then(m => ({ default: m.NovidadesCard })));
const LazyPromoStrip = lazy(() => import("@/components/public/PromoStrip").then(m => ({ default: m.PromoStrip })));
const LazyBannerSections = lazy(() => import("@/components/public/BannerSections").then(m => ({ default: m.BannerSections })));

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
const SWIPE_THRESHOLD = 50;

const swipeVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0.4 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0.4 }),
};

const Index = () => {
  const mainRef = useRef<HTMLElement>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [swipeDir, setSwipeDir] = useState(0);
  const swipingRef = useRef(false);
  const { pullDistance, isRefreshing } = usePullToRefresh(mainRef);

  const tabIndex = TAB_ORDER.indexOf(activeTab as typeof TAB_ORDER[number]);

  const navigateTo = useCallback((newTab: string, direction: number) => {
    setSwipeDir(direction);
    setActiveTab(newTab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleTabChange = useCallback((tabId: string) => {
    const newIdx = TAB_ORDER.indexOf(tabId as typeof TAB_ORDER[number]);
    const dir = newIdx > tabIndex ? 1 : -1;
    navigateTo(tabId, dir);
  }, [tabIndex, navigateTo]);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipe = Math.abs(offset.x) * velocity.x;

    if (offset.x < -SWIPE_THRESHOLD || swipe < -1000) {
      // swipe left → next tab
      if (tabIndex < TAB_ORDER.length - 1) {
        navigateTo(TAB_ORDER[tabIndex + 1], 1);
      }
    } else if (offset.x > SWIPE_THRESHOLD || swipe > 1000) {
      // swipe right → previous tab
      if (tabIndex > 0) {
        navigateTo(TAB_ORDER[tabIndex - 1], -1);
      }
    }
    setTimeout(() => { swipingRef.current = false; }, 50);
  }, [tabIndex, navigateTo]);

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
        <LiveFeedSection />
        <LiveEventsSection />
        <Suspense fallback={<BelowFoldSkeleton />}>
          <LazyNovidadesCard />
          <LazyPromoStrip />
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
        <AnimatePresence mode="wait" custom={swipeDir} initial={false}>
          <motion.div
            key={activeTab}
            custom={swipeDir}
            variants={swipeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 350, damping: 35, mass: 0.8 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragStart={() => { swipingRef.current = true; }}
            onDragEnd={handleDragEnd}
            style={{ touchAction: "pan-y" }}
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
