import { PublicHeader } from "@/components/public/PublicHeader";
import { DailyBannerCarousel } from "@/components/public/DailyBannerCarousel";
import { LiveNowSection } from "@/components/public/LiveNowSection";
import { DailyGamesSection } from "@/components/public/DailyGamesSection";
import { NewsReleasesSection } from "@/components/public/NewsReleasesSection";
import { WatchTodaySection } from "@/components/public/WatchTodaySection";
import { PublicFooter } from "@/components/public/PublicFooter";
import { WhatsAppFab } from "@/components/public/WhatsAppFab";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />

      <main className="flex-1">
        <DailyBannerCarousel />

        <div className="space-y-12 py-6 sm:py-10">
          <LiveNowSection />

          <DailyGamesSection />

          <div id="novidades" className="px-4 sm:px-6">
            <NewsReleasesSection />
          </div>

          <div id="assista" className="px-4 sm:px-6">
            <WatchTodaySection />
          </div>
        </div>
      </main>

      <PublicFooter />
      <WhatsAppFab />
    </div>
  );
};

export default Index;
