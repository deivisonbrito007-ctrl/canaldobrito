import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdminDashboard from "../AdminDashboard";

vi.mock("@/hooks/useBanners", () => ({
  useAllBanners: () => ({ data: [{ active: true }, { active: false }], isLoading: false, isError: false, refetch: vi.fn(), dataUpdatedAt: Date.now() }),
}));
vi.mock("@/hooks/useMovies", () => ({
  useAllMovies: () => ({ data: [{ active: true, genre: "Action" }], isLoading: false, isError: false, refetch: vi.fn(), dataUpdatedAt: Date.now() }),
}));
vi.mock("@/hooks/useSeries", () => ({
  useAllSeries: () => ({ data: [{ active: true, genre: null }], isLoading: false, isError: false, refetch: vi.fn(), dataUpdatedAt: Date.now() }),
}));
vi.mock("@/hooks/useNewsReleases", () => ({
  useAllNewsReleases: () => ({ data: [{ active: true, genres: "Drama" }], isLoading: false, isError: false, refetch: vi.fn(), dataUpdatedAt: Date.now() }),
}));
vi.mock("@/hooks/useDailyGames", () => ({
  useAllDailyGames: () => ({ data: [{ active: true }], isLoading: false, isError: false, refetch: vi.fn(), dataUpdatedAt: Date.now() }),
}));
vi.mock("@/components/admin/UpcomingActivations", () => ({
  UpcomingActivations: () => <div data-testid="upcoming" />,
}));

const wrap = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe("AdminDashboard", () => {
  it("renders stat card labels", () => {
    wrap(<AdminDashboard />);
    expect(screen.getByText("Banners")).toBeInTheDocument();
    expect(screen.getByText("Filmes")).toBeInTheDocument();
    expect(screen.getByText("Séries")).toBeInTheDocument();
    expect(screen.getByText("Novidades")).toBeInTheDocument();
    expect(screen.getByText("Jogos Hoje")).toBeInTheDocument();
  });

  it("renders greeting", () => {
    wrap(<AdminDashboard />);
    const greeting = screen.getByText(/^(Bom dia|Boa tarde|Boa noite) 👋$/);
    expect(greeting).toBeInTheDocument();
  });

  it("renders quick actions including WhatsApp and Configurações", () => {
    wrap(<AdminDashboard />);
    expect(screen.getByText("+ WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("+ Configurações")).toBeInTheDocument();
  });

  it("shows content health alert when items missing genre", () => {
    wrap(<AdminDashboard />);
    expect(screen.getByText(/1 item sem gênero/)).toBeInTheDocument();
  });

  it("renders UpcomingActivations", () => {
    wrap(<AdminDashboard />);
    expect(screen.getByTestId("upcoming")).toBeInTheDocument();
  });
});
