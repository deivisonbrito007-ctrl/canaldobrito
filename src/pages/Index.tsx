import { PublicHeader } from "@/components/public/PublicHeader";
import { DailyBannerCarousel } from "@/components/public/DailyBannerCarousel";
import { NewsReleasesSection } from "@/components/public/NewsReleasesSection";
import { WatchTodaySection } from "@/components/public/WatchTodaySection";
import { PublicFooter } from "@/components/public/PublicFooter";
import { WhatsAppFab } from "@/components/public/WhatsAppFab";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />

      <main className="flex-1 space-y-8 py-5 sm:py-8">
        <DailyBannerCarousel />

        <div className="px-4 sm:px-6">
          <WatchTodaySection />
        </div>
      </main>

      <PublicFooter />
      <WhatsAppFab />
    </div>
  );
};

export default Index;
