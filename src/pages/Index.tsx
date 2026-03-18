import { PublicHeader } from "@/components/public/PublicHeader";
import { HeroBanner } from "@/components/public/HeroBanner";
import { GamesSection } from "@/components/public/GamesSection";
import { MoviesSection } from "@/components/public/MoviesSection";
import { SeriesSection } from "@/components/public/SeriesSection";
import { PublicFooter } from "@/components/public/PublicFooter";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="container flex-1 space-y-6 px-3 sm:px-4 py-4 sm:py-6">
        <HeroBanner />
        <GamesSection />
        <MoviesSection />
        <SeriesSection />
      </main>
      <PublicFooter />
    </div>
  );
};

export default Index;
