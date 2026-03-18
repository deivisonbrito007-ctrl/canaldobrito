import { PublicHeader } from "@/components/public/PublicHeader";
import { BannerSections } from "@/components/public/BannerSections";
import { MoviesSection } from "@/components/public/MoviesSection";
import { SeriesSection } from "@/components/public/SeriesSection";
import { PublicFooter } from "@/components/public/PublicFooter";
import { WhatsAppFab } from "@/components/public/WhatsAppFab";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tv, Film, Clapperboard } from "lucide-react";

type TabKey = "programacao" | "filmes" | "series";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "programacao", label: "Programação", icon: <Tv className="h-4 w-4" /> },
  { key: "filmes", label: "Filmes", icon: <Film className="h-4 w-4" /> },
  { key: "series", label: "Séries", icon: <Clapperboard className="h-4 w-4" /> },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("programacao");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />

      {/* Tab navigation - sticky below header */}
      <nav className="sticky top-[52px] sm:top-[60px] z-40 bg-background/90 backdrop-blur-xl border-b border-border/20">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-3 text-xs sm:text-sm font-semibold transition-colors min-h-[48px] ${
                activeTab === tab.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "programacao" && (
              <div className="py-4 sm:py-6">
                <BannerSections />
              </div>
            )}
            {activeTab === "filmes" && (
              <div className="px-4 sm:px-6 py-4 sm:py-6">
                <MoviesSection />
              </div>
            )}
            {activeTab === "series" && (
              <div className="px-4 sm:px-6 py-4 sm:py-6">
                <SeriesSection />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <PublicFooter />
      <WhatsAppFab />
    </div>
  );
};

export default Index;