import { useState, useCallback } from "react";
import { AppNavbar } from "@/components/public/AppNavbar";
import { DailyBannerCarousel } from "@/components/public/DailyBannerCarousel";
import { LiveNowSection } from "@/components/public/LiveNowSection";
import { NewsReleasesSection } from "@/components/public/NewsReleasesSection";
import { WeeklyMoviesSection } from "@/components/public/WeeklyMoviesSection";
import { WeeklySeriesSection } from "@/components/public/WeeklySeriesSection";
import { DailyGamesSection } from "@/components/public/DailyGamesSection";
import { BannerSections } from "@/components/public/BannerSections";
import { PublicFooter } from "@/components/public/PublicFooter";
import { BottomNav } from "@/components/public/BottomNav";
import { CalendarDays, Star } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
        {activeTab === "highlights" ? (
          /* ── Aba Destaques ── */
          <div className="px-4 pt-5 pb-3 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/15 border border-primary/20 shadow-[0_0_8px_hsl(var(--primary)/0.15)]">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-foreground font-body leading-tight">
                  Destaques <span className="text-primary">Brito Solutions</span>
                </h2>
                <p className="text-[10px] text-muted-foreground/60 font-body tracking-wide">
                  Seleção da semana
                </p>
              </div>
            </div>
            <WeeklyMoviesSection />
            <WeeklySeriesSection />
          </div>
        ) : activeTab === "schedule" ? (
          /* ── Aba Programação ── */
          <div className="px-4 pt-5 pb-3 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground font-body">Programação</h2>
            </div>
            <DailyGamesSection />
          </div>
        ) : (
          /* ── Aba Home (e demais) ── */
          <>
            <div className="px-4 pt-5 pb-3 space-y-1">
              <p className="text-xs text-muted-foreground font-body">Bem-vindo de volta 👋</p>
              <h2 className="text-lg font-bold text-foreground font-body">
                O que vai assistir <span className="text-primary">hoje</span>?
              </h2>
            </div>

            <div className="space-y-8">
              
              <DailyBannerCarousel />

              <div id="esportes">
                <LiveNowSection />
              </div>

              <NewsReleasesSection />


              
              <BannerSections />
            </div>
          </>
        )}
      </main>

      <PublicFooter />
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Index;
