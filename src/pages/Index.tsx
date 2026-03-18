import { useState, useCallback } from "react";
import { AppNavbar } from "@/components/public/AppNavbar";
import { CategoryPills } from "@/components/public/CategoryPills";
import { DailyBannerCarousel } from "@/components/public/DailyBannerCarousel";
import { LiveNowSection } from "@/components/public/LiveNowSection";
import { NewsReleasesSection } from "@/components/public/NewsReleasesSection";
import { WatchTodaySection } from "@/components/public/WatchTodaySection";

import { DailyGamesSection } from "@/components/public/DailyGamesSection";
import { ReleaseBanner } from "@/components/public/ReleaseBanner";
import { FeaturedSection } from "@/components/public/FeaturedSection";
import { BannerSections } from "@/components/public/BannerSections";
import { PublicFooter } from "@/components/public/PublicFooter";
import { BottomNav } from "@/components/public/BottomNav";

type FilterId = "all" | "movies" | "series" | "sports" | "new" | "trending";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [filter, setFilter] = useState<FilterId>("all");

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);

    if (tabId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tabId === "play") {
      document.getElementById("assista")?.scrollIntoView({ behavior: "smooth" });
    } else if (tabId === "schedule") {
      document.getElementById("programacao")?.scrollIntoView({ behavior: "smooth" });
    } else if (tabId === "search") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // "profile" is handled inside BottomNav (navigates to /login)
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
        {/* Greeting */}
        <div className="px-4 pt-5 pb-3 space-y-1">
          <p className="text-xs text-muted-foreground font-body">Bem-vindo de volta 👋</p>
          <h2 className="text-lg font-bold text-foreground font-body">
            O que vai assistir <span className="text-primary">hoje</span>?
          </h2>
        </div>

        <div className="space-y-8">
          <CategoryPills onFilter={(id) => setFilter(id as FilterId)} />

          {/* Hero — real banners from DB */}
          <DailyBannerCarousel />

          {show(["sports"]) && (
            <div id="esportes">
              <LiveNowSection />
            </div>
          )}

          {show(["new", "trending"]) && <NewsReleasesSection />}

          {show(["movies", "series", "trending"]) && (
            <div id="assista">
              <WatchTodaySection />
            </div>
          )}

          

          {show(["sports"]) && (
            <div id="programacao">
              <DailyGamesSection />
            </div>
          )}

          {show(["new"]) && <ReleaseBanner />}
          <FeaturedSection />
          <BannerSections />
        </div>
      </main>

      <PublicFooter />
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Index;
