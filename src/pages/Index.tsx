import { Header } from "@/components/Header";
import { BannerCarousel } from "@/components/BannerCarousel";
import { InfoSection } from "@/components/InfoSection";
import { ShareFAB } from "@/components/ShareFAB";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="container flex-1 space-y-6 px-3 sm:px-4 py-4 sm:py-6">
        <BannerCarousel />
        <InfoSection />
      </main>

      <Footer />
      <ShareFAB />
    </div>
  );
};

export default Index;
