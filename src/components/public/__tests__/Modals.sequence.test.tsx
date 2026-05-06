import { describe, it, expect, vi, afterEach } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ContentDetailSheet } from "../ContentDetailSheet";
import { TrailerModal } from "../TrailerModal";

vi.mock("@/hooks/useTrailerKey", () => ({
  useTrailerKey: () => ({ trailerKey: null, loading: false }),
}));

const item = {
  title: "Como Mágica",
  overview: "Uma aventura.",
  poster_url: "https://example.com/p.jpg",
  backdrop_url: "https://example.com/b.jpg",
  rating: 8.1,
  year: 2026,
  genre: "Animação",
  tmdb_id: 123,
  content_type: "movie",
};

const Harness = ({
  onSheetClose,
  onTrailerClose,
  initialSheet = false,
  initialTrailer = false,
}: {
  onSheetClose?: () => void;
  onTrailerClose?: () => void;
  initialSheet?: boolean;
  initialTrailer?: boolean;
}) => {
  const [sheetOpen, setSheetOpen] = useState(initialSheet);
  const [trailerOpen, setTrailerOpen] = useState(initialTrailer);

  return (
    <div>
      <button onClick={() => setSheetOpen(true)}>open-sheet</button>
      <button onClick={() => setTrailerOpen(true)}>open-trailer</button>
      <ContentDetailSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          onSheetClose?.();
        }}
        item={item}
      />
      <TrailerModal
        open={trailerOpen}
        onClose={() => {
          setTrailerOpen(false);
          onTrailerClose?.();
        }}
        trailerKey="abc"
        title="Como Mágica"
      />
    </div>
  );
};

const findSheet = () => screen.queryByRole("dialog", { name: "Como Mágica" });
const findTrailer = () => screen.queryByRole("dialog", { name: /Trailer/ });

const zIndexOf = (el: Element | null) => {
  if (!el) return -1;
  const m = (el.className as string).match(/z-\[(\d+)\]/);
  return m ? Number(m[1]) : 0;
};

describe("Modais — abertura em sequência (sheet → trailer)", () => {
  afterEach(() => {
    cleanup();
    document.body.style.overflow = "";
  });

  it("apenas o sheet aparece quando só ele é aberto", () => {
    render(<Harness initialSheet />);
    expect(findSheet()).toBeInTheDocument();
    expect(findTrailer()).not.toBeInTheDocument();
  });

  it("apenas o trailer aparece quando só ele é aberto", () => {
    render(<Harness initialTrailer />);
    expect(findTrailer()).toBeInTheDocument();
    expect(findSheet()).not.toBeInTheDocument();
  });

  it("com ambos abertos, o trailer fica em z-index >= ao do sheet (renderizado por cima)", () => {
    render(<Harness initialSheet initialTrailer />);
    const sheet = findSheet()!;
    const trailer = findTrailer()!;
    expect(sheet).toBeInTheDocument();
    expect(trailer).toBeInTheDocument();
    expect(zIndexOf(trailer)).toBeGreaterThanOrEqual(zIndexOf(sheet));
  });

  it("ESC com ambos abertos fecha apenas o trailer; sheet permanece e mantém scroll lock", () => {
    const onSheetClose = vi.fn();
    const onTrailerClose = vi.fn();
    render(
      <Harness
        initialSheet
        initialTrailer
        onSheetClose={onSheetClose}
        onTrailerClose={onTrailerClose}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });

    // Ambos componentes escutam ESC; queremos garantir que após o ESC o trailer
    // suma e o sheet continue. (Os dois podem ter chamado onClose; o que importa
    // é o estado visual resultante.)
    expect(findTrailer()).not.toBeInTheDocument();
    expect(findSheet()).toBeInTheDocument();
    expect(onTrailerClose).toHaveBeenCalled();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("clicar no botão Fechar do trailer fecha apenas o trailer", () => {
    const onSheetClose = vi.fn();
    const onTrailerClose = vi.fn();
    render(
      <Harness
        initialSheet
        initialTrailer
        onSheetClose={onSheetClose}
        onTrailerClose={onTrailerClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Fechar trailer" }));

    expect(findTrailer()).not.toBeInTheDocument();
    expect(findSheet()).toBeInTheDocument();
    expect(onTrailerClose).toHaveBeenCalledTimes(1);
    expect(onSheetClose).not.toHaveBeenCalled();
  });

  it("clicar no botão Fechar do sheet (com sheet sozinho) fecha o sheet e restaura body-scroll", () => {
    const onSheetClose = vi.fn();
    render(<Harness initialSheet onSheetClose={onSheetClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(findSheet()).not.toBeInTheDocument();
    expect(onSheetClose).toHaveBeenCalledTimes(1);
    expect(document.body.style.overflow).toBe("");
  });

  it("backdrop do trailer fecha apenas o trailer (sheet permanece aberto)", () => {
    const onSheetClose = vi.fn();
    const onTrailerClose = vi.fn();
    render(
      <Harness
        initialSheet
        initialTrailer
        onSheetClose={onSheetClose}
        onTrailerClose={onTrailerClose}
      />
    );

    // O backdrop do trailer é o primeiro filho irmão do dialog do trailer com bg-black/85.
    const trailerBackdrop = document.body.querySelector(".bg-black\\/85") as HTMLElement;
    expect(trailerBackdrop).not.toBeNull();
    fireEvent.click(trailerBackdrop);

    expect(findTrailer()).not.toBeInTheDocument();
    expect(findSheet()).toBeInTheDocument();
    expect(onTrailerClose).toHaveBeenCalledTimes(1);
    expect(onSheetClose).not.toHaveBeenCalled();
  });

  it("ESC com somente o sheet aberto fecha o sheet e restaura body-scroll", () => {
    const onSheetClose = vi.fn();
    render(<Harness initialSheet onSheetClose={onSheetClose} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(findSheet()).not.toBeInTheDocument();
    expect(onSheetClose).toHaveBeenCalledTimes(1);
    expect(document.body.style.overflow).toBe("");
  });

  it("fluxo completo: abre sheet → abre trailer → fecha trailer (ESC) → fecha sheet (ESC)", () => {
    render(<Harness />);

    fireEvent.click(screen.getByText("open-sheet"));
    expect(findSheet()).toBeInTheDocument();
    expect(findTrailer()).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("open-trailer"));
    expect(findSheet()).toBeInTheDocument();
    expect(findTrailer()).toBeInTheDocument();

    // ESC fecha o trailer (camada do topo); sheet continua.
    fireEvent.keyDown(window, { key: "Escape" });
    expect(findTrailer()).not.toBeInTheDocument();
    expect(findSheet()).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    // ESC novamente fecha o sheet.
    fireEvent.keyDown(window, { key: "Escape" });
    expect(findSheet()).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });
});
