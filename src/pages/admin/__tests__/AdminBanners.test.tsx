import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminBanners from "../AdminBanners";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: { from: () => ({ upload: vi.fn(), getPublicUrl: () => ({ data: { publicUrl: "url" } }) }) },
    from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }) }) }),
  },
}));

vi.mock("@/hooks/useBanners", () => ({
  useAllBanners: () => ({ data: [], isLoading: false }),
  useCreateBanner: () => ({ mutateAsync: vi.fn() }),
  useUpdateBanner: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
  useDeleteBanner: () => ({ mutate: vi.fn() }),
  CATEGORY_LABELS: {
    cover: "📺 Capa",
    football: "⚽ Futebol",
    basketball: "🏀 Basquete",
    ufc: "🥊 UFC/MMA",
    other_sports: "🏆 Demais Esportes",
    football_guide: "📋 Guia do Futebol",
  },
  CATEGORY_LIST: ["cover", "football", "basketball", "ufc", "other_sports", "football_guide"],
}));

vi.mock("@/components/admin/ProgramacaoTexto", () => ({
  ProgramacaoTexto: () => <div>ProgramacaoTexto</div>,
}));

vi.mock("@/components/admin/DailyGamesManager", () => ({
  DailyGamesManager: () => <div>DailyGamesManager</div>,
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe("AdminBanners", () => {
  it("renders category pills", () => {
    render(<AdminBanners />, { wrapper });
    const capas = screen.getAllByText("📺 Capa");
    expect(capas.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("⚽ Futebol")).toBeInTheDocument();
    expect(screen.getByText("🏀 Basquete")).toBeInTheDocument();
  });

  it("renders section tabs", () => {
    render(<AdminBanners />, { wrapper });
    expect(screen.getByText("📁 Categorias")).toBeInTheDocument();
    expect(screen.getByText("📋 Programação")).toBeInTheDocument();
  });

  it("switches to programacao tab", () => {
    render(<AdminBanners />, { wrapper });
    fireEvent.click(screen.getByText("📋 Programação"));
    expect(screen.getByText("ProgramacaoTexto")).toBeInTheDocument();
  });

  it("shows empty state for category with no banners", () => {
    render(<AdminBanners />, { wrapper });
    expect(screen.getByText("Nenhum banner nesta categoria")).toBeInTheDocument();
  });
});
