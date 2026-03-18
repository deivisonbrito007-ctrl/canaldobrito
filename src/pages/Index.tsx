import { PublicHeader } from "@/components/public/PublicHeader";
import { BannerSections } from "@/components/public/BannerSections";
import { MoviesSection } from "@/components/public/MoviesSection";
import { SeriesSection } from "@/components/public/SeriesSection";
import { PublicFooter } from "@/components/public/PublicFooter";
import { WhatsAppFab } from "@/components/public/WhatsAppFab";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tv, Film, Clapperboard, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TabKey = "programacao" | "filmes" | "series";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "programacao", label: "Programação", icon: <Tv className="h-[18px] w-[18px]" /> },
  { key: "filmes", label: "Filmes", icon: <Film className="h-[18px] w-[18px]" /> },
  { key: "series", label: "Séries", icon: <Clapperboard className="h-[18px] w-[18px]" /> },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("programacao");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />

      {/* Tab navigation */}
      <nav className="sticky top-[49px] sm:top-[57px] z-40 bg-background/90 backdrop-blur-xl border-b border-border/10">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex-1 flex items-center justify-center gap-2 py-3.5 text-xs sm:text-sm font-semibold transition-all duration-200 min-h-[48px] ${
                activeTab === tab.key
                  ? "text-primary"
                  : "text-muted-foreground/60 hover:text-foreground/80"
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-3 right-3 h-[2.5px] rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
        {/* Updated timestamp */}
        <div className="flex items-center justify-center gap-1.5 pb-2 -mt-0.5">
          <Clock className="h-2.5 w-2.5 text-muted-foreground/40" />
          <span className="text-[9px] text-muted-foreground/40 font-medium">
            Atualizado às {format(new Date(), "HH:mm", { locale: ptBR })}
          </span>
        </div>
      </nav>

      {/* Tab content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {activeTab === "programacao" && (
              <div className="py-5 sm:py-8">
                <BannerSections />
              </div>
            )}
            {activeTab === "filmes" && (
              <div className="px-4 sm:px-6 py-5 sm:py-8">
                <MoviesSection />
              </div>
            )}
            {activeTab === "series" && (
              <div className="px-4 sm:px-6 py-5 sm:py-8">
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
