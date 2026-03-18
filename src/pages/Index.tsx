import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { SportFilter } from "@/components/SportFilter";
import { FeaturedGames } from "@/components/FeaturedGames";
import { GameSection } from "@/components/GameSection";
import { GameDetail } from "@/components/GameDetail";
import { ShareWhatsApp } from "@/components/ShareWhatsApp";
import { Footer } from "@/components/Footer";
import { useGames } from "@/hooks/useGames";
import { Game, SportType } from "@/types/sports";
import { Tv, RefreshCw } from "lucide-react";

const Index = () => {
  const [selectedSport, setSelectedSport] = useState<SportType | "all">("all");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const { data: allGames = [], isLoading } = useGames();

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

      <main className="container flex-1 space-y-4 sm:space-y-6 px-3 sm:px-4 py-4 sm:py-6">
        <SportFilter selected={selectedSport} onChange={setSelectedSport} counts={counts} />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando programação...</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Tv className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="font-display text-base sm:text-lg font-semibold text-foreground">
              Nenhuma transmissão programada
            </p>
            <p className="mt-2 max-w-xs text-xs sm:text-sm text-muted-foreground">
              Não há jogos agendados para hoje. Volte mais tarde para conferir a programação atualizada.
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
