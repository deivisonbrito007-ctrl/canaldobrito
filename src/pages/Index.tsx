import { PublicHeader } from "@/components/public/PublicHeader";
import { DailyBannerCarousel } from "@/components/public/DailyBannerCarousel";
import { CategoryBar } from "@/components/public/CategoryBar";
import { DailyGamesSection } from "@/components/public/DailyGamesSection";
import { NewsReleasesSection } from "@/components/public/NewsReleasesSection";
import { MoviesSection } from "@/components/public/MoviesSection";
import { SeriesSection } from "@/components/public/SeriesSection";
import { WatchTodaySection } from "@/components/public/WatchTodaySection";
import { PublicFooter } from "@/components/public/PublicFooter";
import { WhatsAppFab } from "@/components/public/WhatsAppFab";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />

      <main className="flex-1">
        <DailyBannerCarousel />

        <CategoryBar />

        <div className="space-y-8 py-5 sm:py-8">
          <DailyGamesSection />

          <div id="novidades" className="px-4 sm:px-6">
            <NewsReleasesSection />
          </div>

          <div id="assista" className="px-4 sm:px-6">
            <WatchTodaySection />
          </div>

          <div className="px-4 sm:px-6">
            <MoviesSection />
          </div>

          <div className="px-4 sm:px-6">
            <SeriesSection />
          </div>
        </div>
      </main>

      <PublicFooter />
      <WhatsAppFab />
    </div>
  );
};

export default Index;
