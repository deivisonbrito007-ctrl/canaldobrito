/**
 * Tipos e helpers do lado do app para a integração SportsAPI.
 * A chave da API nunca chega aqui: tudo passa pela função de backend `sportsapi-sync`.
 */
import { supabase } from "@/integrations/supabase/client";
export {
  SUGGESTION_STATUS_LABEL,
  type SuggestionStatus,
  type SuggestionWarning,
  type SportsApiTvNetwork,
} from "../../supabase/functions/_shared/sportsApiCore";
import type { SuggestionStatus, SuggestionWarning, SportsApiTvNetwork } from "../../supabase/functions/_shared/sportsApiCore";

export type ReviewStatus = "pending" | "ignored" | "imported";

export interface SportsApiSuggestion {
  id: string;
  date: string;
  external_id: string;
  sport: string;
  sport_type: string;
  title: string | null;
  home_team: string;
  away_team: string;
  competition: string;
  competition_country: string | null;
  start_time: string;
  game_time: string;
  tv_networks: SportsApiTvNetwork[];
  normalized_channels: string[];
  broadcast_country: string | null;
  api_status: string | null;
  home_score: number | null;
  away_score: number | null;
  live_clock: string | null;
  period: string | null;
  status: SuggestionStatus;
  review_status: ReviewStatus;
  warnings: SuggestionWarning[];
  matched_game_id: string | null;
  imported_game_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SportsApiSyncRun {
  id: string;
  date: string;
  kind: string;
  sports: string[];
  total_found: number;
  total_with_transmission: number;
  total_ignored_no_transmission: number;
  total_ready: number;
  total_review: number;
  total_duplicates: number;
  total_updated: number;
  status: string;
  error_message: string | null;
  created_at: string;
}

export type SportsApiAction =
  | { action: "sports" }
  | { action: "fetch"; date: string; sports?: string[] }
  | { action: "live" }
  | { action: "import"; ids: string[]; active?: boolean }
  | { action: "ignore"; ids: string[] }
  | { action: "update-existing"; id: string };

export const WARNING_LABEL: Record<SuggestionWarning["code"], string> = {
  canal_desconhecido: "Canal desconhecido",
  canal_sem_logo: "Canal sem logo",
  pais_nao_informado: "País não informado",
  duplicado: "Duplicado",
  horario_divergente: "Horário divergente",
  competicao_divergente: "Competição divergente",
  esporte_divergente: "Esporte divergente",
  sem_transmissao: "Sem transmissão",
  status_conflitante: "Status conflitante",
  dados_incompletos: "Dados incompletos",
};

/** Chama a função de backend. Lança Error com mensagem amigável. */
export async function callSportsApi<T = unknown>(body: SportsApiAction): Promise<T> {
  const { data, error } = await supabase.functions.invoke("sportsapi-sync", { body });
  if (error) {
    // supabase-js embute a resposta no erro quando o status não é 2xx
    let msg = "Falha ao falar com a SportsAPI.";
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === "function") {
        const j = await ctx.json();
        if (j?.error) msg = j.error;
      }
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (data && typeof data === "object" && "error" in data && (data as { error?: string }).error) {
    throw new Error((data as { error: string }).error);
  }
  return data as T;
}

/** Placar formatado para exibição, ou null quando não disponível. */
export function formatScore(g: { home_score?: number | null; away_score?: number | null }): string | null {
  if (typeof g.home_score !== "number" || typeof g.away_score !== "number") return null;
  return `${g.home_score} x ${g.away_score}`;
}

/** Linha de relógio/período ("74' · Segundo tempo"). */
export function formatLiveClock(g: { live_clock?: string | null; period?: string | null }): string | null {
  const parts = [g.live_clock, g.period].map((p) => (p ?? "").trim()).filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
