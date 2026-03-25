import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  },
}));

vi.mock("@/hooks/useSiteUrl", () => ({
  useSiteUrl: () => "https://example.com",
}));

import AdminWhatsApp from "../AdminWhatsApp";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe("AdminWhatsApp", () => {
  it("renders header and link section", () => {
    render(<AdminWhatsApp />, { wrapper });
    expect(screen.getByText("WhatsApp — Compartilhamento")).toBeInTheDocument();
    expect(screen.getByText("Link do Site")).toBeInTheDocument();
    expect(screen.getByText("https://example.com")).toBeInTheDocument();
  });

  it("renders pre-built templates", () => {
    render(<AdminWhatsApp />, { wrapper });
    expect(screen.getByText("📺 Geral do Dia")).toBeInTheDocument();
    expect(screen.getByText("⚽ Jogos")).toBeInTheDocument();
    expect(screen.getByText("🍿 Entretenimento")).toBeInTheDocument();
    expect(screen.getByText("🔴 Ao Vivo")).toBeInTheDocument();
  });

  it("renders custom message section", () => {
    render(<AdminWhatsApp />, { wrapper });
    expect(screen.getByText("Mensagem Personalizada")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Digite sua mensagem/)).toBeInTheDocument();
  });
});
