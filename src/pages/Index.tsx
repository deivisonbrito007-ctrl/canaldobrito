import { PublicHeader } from "@/components/public/PublicHeader";
import { DailyBannerCarousel } from "@/components/public/DailyBannerCarousel";
import { MoviesSection } from "@/components/public/MoviesSection";
import { SeriesSection } from "@/components/public/SeriesSection";
import { PublicFooter } from "@/components/public/PublicFooter";
import { WhatsAppFab } from "@/components/public/WhatsAppFab";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />

      <main className="flex-1 space-y-8 py-5 sm:py-8">
        <DailyBannerCarousel />

        <div className="px-4 sm:px-6">
          <MoviesSection />
        </div>

        <div className="px-4 sm:px-6">
          <SeriesSection />
        </div>
      </main>

      <PublicFooter />
      <WhatsAppFab />
    </div>
  );
};

export default Index;
