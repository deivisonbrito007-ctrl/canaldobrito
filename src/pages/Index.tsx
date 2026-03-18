import { PublicHeader } from "@/components/public/PublicHeader";
import { DailyBannerCarousel } from "@/components/public/DailyBannerCarousel";
import { LiveNowSection } from "@/components/public/LiveNowSection";
import { BannerSections } from "@/components/public/BannerSections";
import { NewsReleasesSection } from "@/components/public/NewsReleasesSection";
import { WatchTodaySection } from "@/components/public/WatchTodaySection";
import { PublicFooter } from "@/components/public/PublicFooter";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />

      <main className="flex-1">
        <DailyBannerCarousel />

        <div className="space-y-14 py-10 sm:space-y-20 sm:py-14">
          <LiveNowSection />

          <div id="novidades">
            <NewsReleasesSection />
          </div>

          <div id="assista">
            <WatchTodaySection />
          </div>

          <BannerSections />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Index;
