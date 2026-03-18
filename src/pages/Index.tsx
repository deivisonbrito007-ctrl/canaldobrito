import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { SportFilter } from "@/components/SportFilter";
import { FeaturedGames } from "@/components/FeaturedGames";
import { GameSection } from "@/components/GameSection";
import { GameDetail } from "@/components/GameDetail";
import { ShareWhatsApp } from "@/components/ShareWhatsApp";
import { Footer } from "@/components/Footer";
import { mockGames } from "@/data/mockGames";
import { Game, SportType } from "@/types/sports";
import { Tv } from "lucide-react";

const Index = () => {
  const [selectedSport, setSelectedSport] = useState<SportType | "all">("all");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    mockGames.forEach((g) => {
      c[g.sport] = (c[g.sport] || 0) + 1;
    });
    return c;
  }, []);

  const filtered = useMemo(
    () => (selectedSport === "all" ? mockGames : mockGames.filter((g) => g.sport === selectedSport)),
    [selectedSport]
  );

  const featured = useMemo(
    () => filtered.filter((g) => g.highlight || g.status === "live"),
    [filtered]
  );

  const nonFeatured = useMemo(
    () => filtered.filter((g) => !g.highlight && g.status !== "live"),
    [filtered]
  );

  const isEmpty = filtered.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header games={mockGames} />

      <main className="container flex-1 space-y-6 py-6">
        {/* Filters */}
        <SportFilter selected={selectedSport} onChange={setSelectedSport} counts={counts} />

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Tv className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="font-display text-lg font-semibold text-muted-foreground">
              Nenhum jogo para este esporte hoje
            </p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              Volte mais tarde ou selecione outro esporte
            </p>
          </div>
        ) : (
          <>
            <FeaturedGames games={featured} onSelect={setSelectedGame} />
            <GameSection games={nonFeatured} onSelect={setSelectedGame} />
          </>
        )}
      </main>

      <Footer />
      <ShareWhatsApp games={filtered} />

      <GameDetail
        game={selectedGame}
        open={!!selectedGame}
        onClose={() => setSelectedGame(null)}
      />
    </div>
  );
};

export default Index;
