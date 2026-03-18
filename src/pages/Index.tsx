import { PublicHeader } from "@/components/public/PublicHeader";
import { BannerSections } from "@/components/public/BannerSections";
import { MoviesSection } from "@/components/public/MoviesSection";
import { SeriesSection } from "@/components/public/SeriesSection";
import { PublicFooter } from "@/components/public/PublicFooter";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="container flex-1 space-y-8 px-4 sm:px-6 py-6 sm:py-8">
        <BannerSections />
        <MoviesSection />
        <SeriesSection />
      </main>
      <PublicFooter />
    </div>
  );
};

export default Index;