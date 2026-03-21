import { useState, useCallback, lazy, Suspense } from "react";
import { AppNavbar } from "@/components/public/AppNavbar";
import { CategoryIconsCarousel } from "@/components/public/CategoryIconsCarousel";
import { LiveFeedSection } from "@/components/public/LiveFeedSection";
import { NewsReleasesSection } from "@/components/public/NewsReleasesSection";
import { BannerSections } from "@/components/public/BannerSections";
import { PublicFooter } from "@/components/public/PublicFooter";
import { BottomNav } from "@/components/public/BottomNav";
import { SectionHeaderSkeleton, PosterRowSkeleton, GameCardSkeleton } from "@/components/public/ContentSkeletons";

// Lazy-loaded tab content — only fetched when the user opens the tab
const HighlightsTab = lazy(() => import("@/components/public/HighlightsTab"));
const ScheduleTab = lazy(() => import("@/components/public/ScheduleTab"));

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

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-x-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-secondary/8 blur-[120px] animate-drift" />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-primary/6 blur-[100px] animate-drift-delayed" />
      </div>

      {/* Grain overlay */}
      <div className="grain-overlay" />

      <AppNavbar />

      <main className="relative z-10 flex-1 pb-28">
        {activeTab === "highlights" ? (
          <Suspense fallback={<HighlightsFallback />}>
            <HighlightsTab />
          </Suspense>
        ) : activeTab === "schedule" ? (
          <Suspense fallback={<ScheduleFallback />}>
            <ScheduleTab />
          </Suspense>
        ) : (
          <>
            <div className="px-4 pt-4 pb-2 space-y-1">
              <p className="text-xs text-muted-foreground font-body">Bem-vindo de volta 👋</p>
              <h2 className="text-lg font-bold text-foreground font-body">
                O que vai assistir <span className="text-primary">hoje</span>?
              </h2>
            </div>

            <div className="space-y-6">
              <CategoryIconsCarousel />

              <div id="esportes" className="space-y-6">
                <LiveNowSection />
                <LiveEventsSection />
              </div>

              <NewsReleasesSection />

              <BannerSections />
            </div>
          </>
        )}
      </main>

      <PublicFooter />
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Index;
