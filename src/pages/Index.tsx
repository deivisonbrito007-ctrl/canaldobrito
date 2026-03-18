import { AppNavbar } from "@/components/public/AppNavbar";
import { CategoryPills } from "@/components/public/CategoryPills";
import { HeroBanner } from "@/components/public/HeroBanner";
import { LiveNowSection } from "@/components/public/LiveNowSection";
import { WatchTodaySection } from "@/components/public/WatchTodaySection";
import { ContinueWatchingSection } from "@/components/public/ContinueWatchingSection";
import { ReleaseBanner } from "@/components/public/ReleaseBanner";
import { FeaturedSection } from "@/components/public/FeaturedSection";
import { BannerSections } from "@/components/public/BannerSections";
import { BottomNav } from "@/components/public/BottomNav";

const Index = () => {
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
          <CategoryPills />
          <HeroBanner />

          <div id="esportes">
            <LiveNowSection />
          </div>

          <div id="assista">
            <WatchTodaySection />
          </div>

          <ContinueWatchingSection />
          <ReleaseBanner />
          <FeaturedSection />
          <BannerSections />
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
