import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BannerSections } from "../BannerSections";

vi.mock("@/hooks/useBanners", () => ({
  useBannersByCategory: vi.fn((category: string) => {
    if (category === "cover") {
      return {
        data: [
          { id: "1", image_url: "https://example.com/cover.jpg", title: "Cover Banner", active: true, sort_order: 1 },
        ],
        isLoading: false,
      };
    }
    return { data: [], isLoading: false };
  }),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe("BannerSections", () => {
  it("renders cover section with banners", () => {
    render(<BannerSections />, { wrapper });
    expect(screen.getByText("Cover Banner")).toBeInTheDocument();
    expect(screen.getByText("Destaques")).toBeInTheDocument();
  });

  it("hides categories with no banners", () => {
    render(<BannerSections />, { wrapper });
    expect(screen.queryByText("Basquete")).not.toBeInTheDocument();
    expect(screen.queryByText("UFC/MMA")).not.toBeInTheDocument();
  });
});
