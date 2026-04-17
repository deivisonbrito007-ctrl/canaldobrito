import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdminNovidades from "../AdminNovidades";

const searchMock = vi.fn();
const setResultsMock = vi.fn();
const fetchDetailsMock = vi.fn(async () => ({ genres: [{ id: 1, name: "Ação" }], vote_average: 8, overview: "x", backdrop_path: "/bk.jpg", runtime: 120 }));
const addMutateAsync = vi.fn(async () => ({}));
const toggleMutate = vi.fn();
const deleteMutate = vi.fn();
const updateMutate = vi.fn();
const updateMutateAsync = vi.fn(async () => ({}));

let tmdbResults: any[] = [];
let itemList: any[] = [];

vi.mock("@/hooks/useTMDB", () => ({
  useTMDBSearch: () => ({
    results: tmdbResults,
    loading: false,
    search: searchMock,
    setResults: setResultsMock,
    fetchDetails: fetchDetailsMock,
  }),
}));

vi.mock("@/hooks/useNewsReleases", () => ({
  useAllNewsReleases: () => ({ data: itemList }),
  useAddNewsRelease: () => ({ mutateAsync: addMutateAsync }),
  useToggleNewsRelease: () => ({ mutate: toggleMutate }),
  useDeleteNewsRelease: () => ({ mutate: deleteMutate }),
  useUpdateNewsRelease: () => ({ mutate: updateMutate, mutateAsync: updateMutateAsync }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

const wrap = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe("AdminNovidades", () => {
  beforeEach(() => {
    tmdbResults = [];
    itemList = [];
    searchMock.mockClear();
    addMutateAsync.mockClear();
    updateMutate.mockClear();
  });

  it("renderiza header, busca e estado vazio", () => {
    wrap(<AdminNovidades />);
    expect(screen.getByText("Buscar Conteúdo")).toBeInTheDocument();
    expect(screen.getByText("Nenhum item adicionado")).toBeInTheDocument();
    expect(screen.getByText("0 ativos / 0")).toBeInTheDocument();
  });

  it("dispara busca de filme via Enter", () => {
    wrap(<AdminNovidades />);
    const input = screen.getByPlaceholderText("Nome do filme...");
    fireEvent.change(input, { target: { value: "Avatar" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(searchMock).toHaveBeenCalledWith("search_movie", "Avatar");
  });

  it("renderiza item adicionado com título e badge", () => {
    itemList = [
      {
        id: "1", tmdb_id: 100, title: "Duna 2", active: true,
        content_type: "movie", badge_type: "novidade", image_url: null,
        year: 2024, genres: "Ficção", display_order: 0, runtime: 165, seasons: null,
      },
    ];
    wrap(<AdminNovidades />);
    expect(screen.getByText("Duna 2")).toBeInTheDocument();
    expect(screen.getByText("🎬 Filme")).toBeInTheDocument();
    expect(screen.getByText("1 ativos / 1")).toBeInTheDocument();
    expect(screen.getByText("Ficção")).toBeInTheDocument();
  });

  it("destaca itens sem gênero com botão de batch update", () => {
    itemList = [
      { id: "1", tmdb_id: 1, title: "X", active: true, content_type: "movie", badge_type: "novidade", genres: null, display_order: 0 },
      { id: "2", tmdb_id: 2, title: "Y", active: true, content_type: "series", badge_type: "estreia", genres: null, display_order: 1 },
    ];
    wrap(<AdminNovidades />);
    expect(screen.getByText(/Atualizar 2 sem gênero/)).toBeInTheDocument();
    expect(screen.getAllByText("sem gênero").length).toBe(2);
  });

  it("mostra badge de série quando content_type é 'series'", () => {
    itemList = [{ id: "1", tmdb_id: 1, title: "Stranger Things", active: true, content_type: "series", badge_type: "nova_temporada", genres: "Drama", display_order: 0, seasons: 4 }];
    wrap(<AdminNovidades />);
    expect(screen.getByText("📺 Série")).toBeInTheDocument();
    expect(screen.getByText("4 temporadas")).toBeInTheDocument();
  });
});
