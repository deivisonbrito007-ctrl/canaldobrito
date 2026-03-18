import { PublicHeader } from "@/components/public/PublicHeader";
import { DailyBannerCarousel } from "@/components/public/DailyBannerCarousel";
import { LiveNowSection } from "@/components/public/LiveNowSection";
import { DailyGamesSection } from "@/components/public/DailyGamesSection";
import { NewsReleasesSection } from "@/components/public/NewsReleasesSection";
import { WatchTodaySection } from "@/components/public/WatchTodaySection";
import { PublicFooter } from "@/components/public/PublicFooter";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />

      <main className="flex-1">
        <DailyBannerCarousel />

        <div className="space-y-10 py-6 sm:space-y-14 sm:py-10">
          <LiveNowSection />

          <DailyGamesSection />

          <div id="novidades">
            <NewsReleasesSection />
          </div>

          <div id="assista" className="px-3 sm:px-6">
            <WatchTodaySection />
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Index;
