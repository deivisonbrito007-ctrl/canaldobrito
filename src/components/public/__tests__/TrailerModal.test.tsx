import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { TrailerModal } from "../TrailerModal";

describe("TrailerModal", () => {
  afterEach(() => cleanup());

  it("não renderiza quando open=false", () => {
    render(<TrailerModal open={false} onClose={() => {}} trailerKey="abc" />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renderiza via portal no body com z-[100]", () => {
    render(<TrailerModal open={true} onClose={() => {}} trailerKey="abc" title="X" />);
    const dialog = screen.getByRole("dialog");
    expect(document.body.contains(dialog)).toBe(true);
    expect(dialog.className).toMatch(/z-\[100\]/);
  });

  it("mostra iframe do YouTube com a key correta", () => {
    render(<TrailerModal open={true} onClose={() => {}} trailerKey="abc123" />);
    const iframe = document.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toContain("youtube.com/embed/abc123");
  });

  it("mostra loader quando loading=true", () => {
    render(<TrailerModal open={true} onClose={() => {}} trailerKey={null} loading />);
    expect(document.body.querySelector(".animate-spin")).toBeTruthy();
  });

  it("mostra fallback quando não há trailer", () => {
    render(<TrailerModal open={true} onClose={() => {}} trailerKey={null} />);
    expect(screen.getByText("Trailer não disponível")).toBeInTheDocument();
  });

  it("dispara onClose ao clicar no botão fechar", () => {
    const onClose = vi.fn();
    render(<TrailerModal open={true} onClose={onClose} trailerKey="abc" />);
    fireEvent.click(screen.getByLabelText("Fechar trailer"));
    expect(onClose).toHaveBeenCalled();
  });

  it("fecha com ESC", () => {
    const onClose = vi.fn();
    render(<TrailerModal open={true} onClose={onClose} trailerKey="abc" />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
