import { useState, useCallback, lazy, Suspense } from "react";
import { AppNavbar } from "@/components/public/AppNavbar";
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

/** Skeleton for lazy below-fold sections (Novidades + Promo + Banners) */
const BelowFoldSkeleton = () => (
  <div className="space-y-5 px-4" style={{ minHeight: 560 }}>
    <NewsBannerSkeleton />
    {/* Promo strip placeholder */}
    <div className="rounded-xl skeleton-shimmer h-[88px]" />
  </div>
);

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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

      <main className="relative z-10 flex-1 pb-28" style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom, 0px))" }}>
        {activeTab === "highlights" ? (
          <Suspense fallback={<HighlightsFallback />}>
            <HighlightsTab />
          </Suspense>
        ) : activeTab === "schedule" ? (
          <Suspense fallback={<ScheduleFallback />}>
            <ScheduleTab />
          </Suspense>
        ) : (
          <div className="space-y-5 min-h-[80vh]">
            <Hero />
            <CategoryIconsCarousel />
            <LiveFeedSection />
            <LiveEventsSection />
            <Suspense fallback={<BelowFoldSkeleton />}>
              <div className="space-y-5 px-4">
                <LazyNovidadesCard />
                <LazyPromoStrip />
              </div>
              <LazyBannerSections />
            </Suspense>
          </div>
        )}
      </main>

      <PublicFooter />
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Index;
