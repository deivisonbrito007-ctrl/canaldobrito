import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { useState } from "react";
import { ContentDetailSheet } from "../ContentDetailSheet";
import { TrailerModal } from "../TrailerModal";
import { BottomNav } from "../BottomNav";

vi.mock("@/hooks/useTrailerKey", () => ({
  useTrailerKey: () => ({ trailerKey: null, loading: false }),
}));

const item = {
  title: "Como Mágica",
  overview: "Aventura.",
  poster_url: "https://example.com/p.jpg",
  backdrop_url: "https://example.com/b.jpg",
  rating: 8.1,
  year: 2026,
  genre: "Animação",
  tmdb_id: 123,
  content_type: "movie",
};

const Harness = ({ kind }: { kind: "sheet" | "trailer" }) => {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <BottomNav activeTab="novidades" onTabChange={() => {}} />
      {kind === "sheet" ? (
        <ContentDetailSheet open={open} onClose={() => setOpen(false)} item={item} />
      ) : (
        <TrailerModal open={open} onClose={() => setOpen(false)} trailerKey="abc" title="X" />
      )}
    </div>
  );
};

const zIndexOf = (el: Element | null) => {
  if (!el) return -1;
  const m = el.className.toString().match(/z-\[(\d+)\]/) || el.className.toString().match(/z-(\d+)/);
  return m ? Number(m[1]) : 0;
};

describe("Modais — integração com BottomNav", () => {
  afterEach(() => cleanup());

  describe("ContentDetailSheet", () => {
    it("renderiza via portal direto em document.body (fora do container do componente)", () => {
      const { container } = render(<Harness kind="sheet" />);
      const dialog = screen.getByRole("dialog");
      expect(document.body.contains(dialog)).toBe(true);
      expect(container.contains(dialog)).toBe(false);
    });

    it("usa z-index maior que o BottomNav (z-50)", () => {
      const { container } = render(<Harness kind="sheet" />);
      const nav = container.querySelector("nav")!;
      const dialog = screen.getByRole("dialog");
      expect(zIndexOf(dialog)).toBeGreaterThan(zIndexOf(nav));
      expect(zIndexOf(dialog)).toBeGreaterThanOrEqual(60);
    });

    it("fecha ao pressionar ESC", () => {
      render(<Harness kind="sheet" />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("fecha ao clicar no backdrop", () => {
      render(<Harness kind="sheet" />);
      // backdrop é o primeiro motion.div fixed com bg-black/60
      const backdrop = document.body.querySelector(".fixed.inset-0.bg-black\\/60") as HTMLElement;
      expect(backdrop).toBeTruthy();
      fireEvent.click(backdrop);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("fecha ao clicar no botão X", () => {
      render(<Harness kind="sheet" />);
      fireEvent.click(screen.getByLabelText("Fechar"));
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  describe("TrailerModal", () => {
    it("renderiza via portal em document.body", () => {
      const { container } = render(<Harness kind="trailer" />);
      const dialog = screen.getByRole("dialog");
      expect(document.body.contains(dialog)).toBe(true);
      expect(container.contains(dialog)).toBe(false);
    });

    it("z-index acima do BottomNav", () => {
      const { container } = render(<Harness kind="trailer" />);
      const nav = container.querySelector("nav")!;
      const dialog = screen.getByRole("dialog");
      expect(zIndexOf(dialog)).toBeGreaterThan(zIndexOf(nav));
      expect(zIndexOf(dialog)).toBeGreaterThanOrEqual(70);
    });

    it("fecha com ESC", () => {
      render(<Harness kind="trailer" />);
      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("fecha ao clicar no backdrop", () => {
      render(<Harness kind="trailer" />);
      const backdrop = document.body.querySelector(".fixed.inset-0.bg-black\\/85") as HTMLElement;
      expect(backdrop).toBeTruthy();
      fireEvent.click(backdrop);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("fecha pelo botão Fechar trailer", () => {
      render(<Harness kind="trailer" />);
      fireEvent.click(screen.getByLabelText("Fechar trailer"));
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("BottomNav permanece no DOM enquanto modal está aberto (portal não desmonta nav)", () => {
    const { container } = render(<Harness kind="sheet" />);
    expect(container.querySelector("nav")).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // sanity: nav e dialog coexistem
    const nav = container.querySelector("nav")!;
    const dialog = screen.getByRole("dialog");
    expect(within(nav).queryByRole("dialog")).toBeNull();
    expect(nav.contains(dialog)).toBe(false);
  });
});
