import { PublicHeader } from "@/components/public/PublicHeader";
import { BannerSections } from "@/components/public/BannerSections";
import { MoviesSection } from "@/components/public/MoviesSection";
import { SeriesSection } from "@/components/public/SeriesSection";
import { PublicFooter } from "@/components/public/PublicFooter";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="container flex-1 space-y-6 px-3 sm:px-4 py-4 sm:py-6">
        <BannerSections />
        <MoviesSection />
        <SeriesSection />
      </main>
      <PublicFooter />
    </div>
  );
};

export default Index;
