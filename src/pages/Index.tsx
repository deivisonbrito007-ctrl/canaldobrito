import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { SportFilter } from "@/components/SportFilter";
import { FeaturedGames } from "@/components/FeaturedGames";
import { GameSection } from "@/components/GameSection";
import { GameDetail } from "@/components/GameDetail";
import { ShareWhatsApp } from "@/components/ShareWhatsApp";
import { Footer } from "@/components/Footer";
import { useGames } from "@/hooks/useGames";
import { mockGames } from "@/data/mockGames";
import { Game, SportType } from "@/types/sports";
import { Tv, RefreshCw } from "lucide-react";

const Index = () => {
  const [selectedSport, setSelectedSport] = useState<SportType | "all">("all");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const { data: dbGames, isLoading } = useGames();

  // Use DB games if available, fallback to mock
  const allGames = useMemo(() => {
    if (dbGames && dbGames.length > 0) return dbGames;
    return mockGames;
  }, [dbGames]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    allGames.forEach((g) => {
      c[g.sport] = (c[g.sport] || 0) + 1;
    });
    return c;
  }, [allGames]);

  const filtered = useMemo(
    () => (selectedSport === "all" ? allGames : allGames.filter((g) => g.sport === selectedSport)),
    [selectedSport, allGames]
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
      <Header games={allGames} />

      <main className="container flex-1 space-y-6 py-6">
        <SportFilter selected={selectedSport} onChange={setSelectedSport} counts={counts} />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando jogos...</p>
          </div>
        ) : isEmpty ? (
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
