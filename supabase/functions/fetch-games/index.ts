// API-Football → daily_games (sport_type='football', source='api-football')
// Roda diariamente via cron e/ou manualmente pelo painel admin.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Ligas brasileiras + sul-americanas relevantes (IDs da API-Football).
// Edite aqui para incluir/excluir competições.
const DEFAULT_LEAGUES = [
  71,  // Brasileirão Série A
  72,  // Brasileirão Série B
  73,  // Copa do Brasil
  13,  // CONMEBOL Libertadores
  11,  // CONMEBOL Sul-Americana
  475, // Campeonato Carioca
  624, // Paulistão
];

const COMP_NAME: Record<number, string> = {
  71: "Brasileirão Série A",
  72: "Brasileirão Série B",
  73: "Copa do Brasil",
  13: "Libertadores",
  11: "Sul-Americana",
  475: "Carioca",
  624: "Paulistão",
};

function todayBRT(): string {
  // YYYY-MM-DD em America/Sao_Paulo
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("API_FOOTBALL_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API_FOOTBALL_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date") || todayBRT();
    if (!isValidDate(dateParam)) {
      return new Response(JSON.stringify({ error: "invalid date (use YYYY-MM-DD)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const leaguesParam = url.searchParams.get("leagues");
    const leagueIds = leaguesParam
      ? leaguesParam.split(",").map((s) => Number(s.trim())).filter(Boolean)
      : DEFAULT_LEAGUES;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const allFixtures: any[] = [];
    const errors: string[] = [];

    // Uma chamada por liga (limita escopo + respeita rate limit gratuito).
    for (const leagueId of leagueIds) {
      const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${dateParam}&league=${leagueId}&season=${new Date(dateParam).getUTCFullYear()}&timezone=America/Sao_Paulo`;
      const r = await fetch(apiUrl, {
        headers: { "x-apisports-key": apiKey },
      });
      if (!r.ok) {
        errors.push(`league ${leagueId}: HTTP ${r.status}`);
        continue;
      }
      const json = await r.json();
      // API-Football retorna 200 mesmo em erros de plano/cota — checa json.errors
      if (json.errors && (Array.isArray(json.errors) ? json.errors.length : Object.keys(json.errors).length)) {
        const msg = Array.isArray(json.errors)
          ? json.errors.join("; ")
          : Object.entries(json.errors).map(([k, v]) => `${k}: ${v}`).join("; ");
        errors.push(`league ${leagueId}: ${msg}`);
        continue;
      }
      if (Array.isArray(json.response)) allFixtures.push(...json.response);
    }

    // Mapeia para schema daily_games
    const rows = allFixtures.map((f: any) => {
      const dt = new Date(f.fixture.date);
      // game_time HH:MM:SS no fuso BRT
      const timeStr = new Intl.DateTimeFormat("en-GB", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(dt);
      const dateStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(dt);

      const leagueName =
        COMP_NAME[f.league.id] || f.league.name || "Futebol";

      return {
        date: dateStr,
        home_team: f.teams.home.name,
        away_team: f.teams.away.name,
        competition: leagueName,
        competition_detail: f.league.round || null,
        game_time: timeStr,
        channels: [],
        is_live: false,
        is_womens: false,
        active: true,
        archived: false,
        status_short: f.fixture.status?.short || "NS",
        elapsed_minutes: f.fixture.status?.elapsed ?? null,
        sport_type: "football",
        source: "api-football",
        external_id: String(f.fixture.id),
      };
    });

    let upserted = 0;
    if (rows.length > 0) {
      const { error, count } = await supabase
        .from("daily_games")
        .upsert(rows, { onConflict: "external_id", count: "exact" });
      if (error) throw error;
      upserted = count ?? rows.length;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        date: dateParam,
        leaguesFetched: leagueIds.length,
        fixtures: allFixtures.length,
        upserted,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[fetch-games]", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
