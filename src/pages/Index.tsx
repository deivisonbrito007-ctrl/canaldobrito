import { useState, useCallback } from "react";
import { AppNavbar } from "@/components/public/AppNavbar";
import { CategoryPills } from "@/components/public/CategoryPills";
import { DailyBannerCarousel } from "@/components/public/DailyBannerCarousel";
import { LiveNowSection } from "@/components/public/LiveNowSection";
import { NewsReleasesSection } from "@/components/public/NewsReleasesSection";
import { WeeklyMoviesSection } from "@/components/public/WeeklyMoviesSection";
import { WeeklySeriesSection } from "@/components/public/WeeklySeriesSection";
import { DailyGamesSection } from "@/components/public/DailyGamesSection";
import { ReleaseBanner } from "@/components/public/ReleaseBanner";
import { BannerSections } from "@/components/public/BannerSections";
import { PublicFooter } from "@/components/public/PublicFooter";
import { BottomNav } from "@/components/public/BottomNav";
import { CalendarDays, Star } from "lucide-react";

type FilterId = "all" | "movies" | "series" | "sports" | "new" | "trending";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [filter, setFilter] = useState<FilterId>("all");

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);

    if (tabId === "home" || tabId === "search" || tabId === "highlights") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tabId === "schedule") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const show = (sections: FilterId[]) => filter === "all" || sections.includes(filter);

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

      <main className="relative z-10 flex-1 pb-24">
        {activeTab === "schedule" ? (
          /* ── Aba Programação ── */
          <div className="px-4 pt-5 pb-3 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground font-body">Programação</h2>
            </div>
            <DailyGamesSection />
          </div>
        ) : (
          /* ── Aba Home (e demais) ── */
          <>
            <div className="px-4 pt-5 pb-3 space-y-1">
              <p className="text-xs text-muted-foreground font-body">Bem-vindo de volta 👋</p>
              <h2 className="text-lg font-bold text-foreground font-body">
                O que vai assistir <span className="text-primary">hoje</span>?
              </h2>
            </div>

            <div className="space-y-8">
              <CategoryPills onFilter={(id) => setFilter(id as FilterId)} />
              <DailyBannerCarousel />

              {show(["sports"]) && (
                <div id="esportes">
                  <LiveNowSection />
                </div>
              )}

              {show(["new", "trending"]) && <NewsReleasesSection />}

              {show(["movies", "trending"]) && (
                <div id="assista">
                  <WeeklyMoviesSection />
                </div>
              )}

              {show(["series", "trending"]) && <WeeklySeriesSection />}

              {show(["new"]) && <ReleaseBanner />}
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
