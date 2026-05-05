import { useState, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppNavbar } from "@/components/public/AppNavbar";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/public/PullToRefreshIndicator";
import { CategoryIconsCarousel } from "@/components/public/CategoryIconsCarousel";
import { LivePageContent } from "@/components/public/LivePageContent";
import { PublicFooter } from "@/components/public/PublicFooter";
import { BottomNav } from "@/components/public/BottomNav";
import { SectionHeaderSkeleton, GameCardSkeleton, NewsBannerSkeleton } from "@/components/public/ContentSkeletons";
import { SLUG_TO_TAB } from "@/lib/utils";
import { captureLandingAttribution, getStoredAttribution, track } from "@/lib/analytics";

const ScheduleTab = lazy(() => import("@/components/public/ScheduleTab"));
const LazyNovidadesPage = lazy(() => import("@/components/public/NovidadesPage").then(m => ({ default: m.NovidadesPage })));
const LazyPromoStrip = lazy(() => import("@/components/public/PromoStrip").then(m => ({ default: m.PromoStrip })));

const LazyAnalyticsDebugOverlay = lazy(() => import("@/components/public/AnalyticsDebugOverlay"));

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

const TAB_ORDER = ["live", "novidades", "schedule"] as const;
type TabId = typeof TAB_ORDER[number];

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

const Index = () => {
  const mainRef = useRef<HTMLElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>("live");
  const [direction, setDirection] = useState(0);
  const { pullDistance, isRefreshing } = usePullToRefresh(mainRef);

  const handleTabChange = useCallback((tabId: string) => {
    // Backwards-compat: legacy "home" → live; legacy "highlights"/"sugestoes" → novidades
    let normalized = tabId;
    if (normalized === "home") normalized = "live";
    if (normalized === "highlights" || normalized === "sugestoes" || normalized === "destaques") normalized = "novidades";
    const next = normalized as TabId;
    if (!TAB_ORDER.includes(next)) return;
    setActiveTab((prev) => {
      const prevIdx = TAB_ORDER.indexOf(prev);
      const nextIdx = TAB_ORDER.indexOf(next);
      setDirection(nextIdx >= prevIdx ? 1 : -1);
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Listen for nav-tab-change events from other components
  useEffect(() => {
    const handler = (e: Event) => {
      const tabId = (e as CustomEvent).detail as string;
      handleTabChange(tabId);
    };
    window.addEventListener("nav-tab-change", handler);
    return () => window.removeEventListener("nav-tab-change", handler);
  }, [handleTabChange]);

  // Deep-link support + UTM landing attribution.
  // Runs once on mount: resolves tab from path/query, captures UTMs, then cleans the URL.
  useEffect(() => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("tab");
    const candidate = path || fromQuery;
    let landingTab: TabId = "live";
    if (candidate) {
      const mapped = SLUG_TO_TAB[candidate.toLowerCase()];
      if (mapped) {
        handleTabChange(mapped);
        landingTab = mapped as TabId;
      }
    }
    // Capture UTMs BEFORE we strip the query, correlating with the resolved tab.
    captureLandingAttribution(landingTab);

    if (fromQuery || params.has("utm_source") || params.has("utm_campaign") || params.has("utm_content")) {
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", cleanUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Emit a tab_view event whenever the active tab changes, attaching last attribution.
  useEffect(() => {
    const attribution = getStoredAttribution();
    track("tab_view", {
      tab: activeTab,
      utm_source: attribution?.utm_source ?? null,
      utm_medium: attribution?.utm_medium ?? null,
      utm_campaign: attribution?.utm_campaign ?? null,
      utm_content: attribution?.utm_content ?? null,
      from_share: attribution?.utm_campaign?.startsWith("share-") ?? false,
    });
  }, [activeTab]);

  const renderContent = () => {
    if (activeTab === "schedule") {
      return (
        <Suspense fallback={<ScheduleFallback />}>
          <ScheduleTab />
        </Suspense>
      );
    }
    if (activeTab === "novidades") {
      return (
        <Suspense fallback={<BelowFoldSkeleton />}>
          <LazyNovidadesPage />
        </Suspense>
      );
    }
    // live (default)
    return (
      <div className="space-y-5 min-h-[80vh]">
        <CategoryIconsCarousel />
        <div id="live" className="scroll-mt-20">
          <LivePageContent />
        </div>
        <Suspense fallback={<BelowFoldSkeleton />}>
          <LazyPromoStrip />
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
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <PublicFooter />
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      <Suspense fallback={null}>
        <LazyAnalyticsDebugOverlay />
      </Suspense>
    </div>
  );
};

export default Index;
