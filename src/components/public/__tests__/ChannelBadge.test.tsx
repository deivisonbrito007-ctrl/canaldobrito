import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChannelBadge } from "../ChannelBadge";

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(() => false),
}));

describe("ChannelBadge", () => {
  it("renders known channel with correct emoji and name", () => {
    render(<ChannelBadge name="ESPN" />);
    const badge = screen.getByText("ESPN");
    expect(badge).toBeInTheDocument();
    expect(badge.closest("span")).toHaveTextContent("📺");
  });

  it("renders SporTV with football emoji", () => {
    render(<ChannelBadge name="SporTV" />);
    expect(screen.getByText("SporTV")).toBeInTheDocument();
  });

  it("renders unknown channel with fallback emoji", () => {
    render(<ChannelBadge name="Canal Desconhecido" />);
    const badge = screen.getByText("Canal Desconhecido");
    expect(badge).toBeInTheDocument();
    expect(badge.closest("span")).toHaveTextContent("📺");
  });

  it("renders short name on mobile for Prime Video", async () => {
    const { useIsMobile } = await import("@/hooks/use-mobile");
    (useIsMobile as ReturnType<typeof vi.fn>).mockReturnValue(true);

    render(<ChannelBadge name="Prime Video" />);
    expect(screen.getByText("Prime")).toBeInTheDocument();
  });

  it("renders Canal do Brito with special styling", () => {
    render(<ChannelBadge name="Canal do Brito" />);
    const badge = screen.getByAltText("Canal do Brito");
    expect(badge).toBeInTheDocument();
  });
});
