import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ===================== CHANNEL MAPPING =====================
const CHANNEL_MAP: Record<string, string> = {
  // Futebol Brasileiro
  "Serie A": "Premiere / Globo",
  "Brasileirão Série A": "Premiere / Globo",
  "Brasileirão Série B": "Premiere / SporTV",
  "Copa Do Brasil": "Globo / SporTV / Amazon Prime",
  "Copa do Nordeste": "SporTV / ESPN",
  "Campeonato Paulista": "Record / CazéTV",
  "Campeonato Carioca": "Band / SporTV",
  "Campeonato Mineiro": "Globo MG / Premiere",
  "Campeonato Gaúcho": "Premiere / RBS TV",
  "Supercopa do Brasil": "Globo",
  // Competições Sul-Americanas
  "Copa Libertadores": "ESPN / Paramount+",
  "Copa Sul-Americana": "Paramount+ / SporTV",
  "Recopa Sudamericana": "ESPN / SporTV",
  // Competições Europeias
  "UEFA Champions League": "TNT Sports / Max",
  "Champions League": "TNT Sports / Max",
  "UEFA Europa League": "CazéTV",
  "Europa League": "CazéTV",
  "Conference League": "CazéTV",
  "Premier League": "ESPN / Star+",
  "La Liga": "ESPN / Star+",
  "Ligue 1": "CazéTV",
  "Bundesliga": "CazéTV / OneFootball",
  // Seleções
  "Copa America": "Globo / SporTV",
  "World Cup": "Globo / SporTV",
  "Copa do Mundo": "Globo / SporTV",
  "Eliminatórias": "Globo",
  "FIFA World Cup Qualification": "Globo",
  "Serie A (Itália)": "ESPN / Star+",
  // Ligas adicionais
  "MLS": "Apple TV+",
  "Saudi Pro League": "BandSports / CazéTV",
  "Saudi Professional League": "BandSports / CazéTV",
  "Liga MX": "ESPN / Star+",
  "Primeira Liga": "ESPN / Star+",
  "Liga Portugal": "ESPN / Star+",
  "World Cup Qualification South America": "Globo",
  "World Cup Qualification CONCACAF": "SporTV",
  "World Cup Qualification Europe": "SporTV",
  // Basketball
  "NBA": "ESPN / TNT Sports",
  // Football Americano
  "NFL": "ESPN / NFL Game Pass",
  "NCAAF": "ESPN",
  // Baseball
  "MLB": "ESPN",
  // Tennis
  "ATP": "ESPN / SporTV",
  "WTA": "ESPN / SporTV",
  // Motorsport
  "Formula 1": "Band / F1 TV",
  "F1": "Band / F1 TV",
  // MMA
  "UFC": "Combate / UFC Fight Pass",
  // Hockey
  "NHL": "ESPN",
  // Golf
  "PGA Tour": "ESPN",
  "PGA": "ESPN",
};

function getChannel(league: string, sport: string): string | null {
  if (CHANNEL_MAP[league]) return CHANNEL_MAP[league];
  for (const [key, channel] of Object.entries(CHANNEL_MAP)) {
    if (league.toLowerCase().includes(key.toLowerCase())) return channel;
  }
  if (sport === "basketball") return "ESPN / TNT Sports";
  return null;
}

interface NormalizedGame {
  sport: "football" | "basketball";
  league: string;
  league_icon: string | null;
  home_team_name: string;
  away_team_name: string;
  home_team_logo: string | null;
  away_team_logo: string | null;
  home_team_score: number | null;
  away_team_score: number | null;
  start_time: string;
  status: "scheduled" | "live" | "finished";
  venue: string | null;
  round: string | null;
  highlight: boolean;
  api_source: "api-football" | "balldontlie";
  external_id: string;
  broadcast_channel: string | null;
}

// ===================== API-FOOTBALL =====================
async function fetchFootball(apiKey: string): Promise<NormalizedGame[]> {
  const games: NormalizedGame[] = [];
  const today = new Date().toISOString().split("T")[0];
  const currentYear = new Date().getFullYear();
  // API-Football free plan limits seasons; try current year and fallback to previous
  const seasons = [currentYear, currentYear - 1, currentYear - 2];

  // Brazilian + international leagues
  const leagues = [
    71,   // Brasileirão Série A
    72,   // Brasileirão Série B
    73,   // Copa do Brasil
    75,   // Copa do Nordeste
    475,  // Campeonato Paulista
    476,  // Campeonato Carioca
    2,    // Champions League
    3,    // Europa League
    848,  // Conference League
    13,   // Copa Libertadores
    11,   // Copa Sul-Americana
    39,   // Premier League
    140,  // La Liga
    135,  // Serie A (Itália)
    61,   // Ligue 1
    78,   // Bundesliga
    1,    // World Cup
    29,   // World Cup Qualifiers SA
  ];

  console.log(`[API-Football] Fetching ${leagues.length} leagues for ${today}`);

  for (const leagueId of leagues) {
    let foundFixtures = false;
    for (const season of seasons) {
      if (foundFixtures) break;
      try {
        const res = await fetch(
          `https://v3.football.api-sports.io/fixtures?date=${today}&league=${leagueId}&season=${season}`,
          { headers: { "x-apisports-key": apiKey } }
        );
        const data = await res.json();

        if (data.errors && Object.keys(data.errors).length > 0) {
          // Try next season
          continue;
        }

        const fixtures = data.response || [];
        if (fixtures.length === 0) continue;
        
        foundFixtures = true;
        console.log(`[API-Football] League ${leagueId} season ${season}: ${fixtures.length} fixtures`);

        for (const fixture of fixtures) {
          const statusMap: Record<string, "scheduled" | "live" | "finished"> = {
            NS: "scheduled", TBD: "scheduled",
            "1H": "live", HT: "live", "2H": "live", ET: "live", P: "live",
            FT: "finished", AET: "finished", PEN: "finished",
          };
          const status = statusMap[fixture.fixture.status.short] || "scheduled";
          const leagueName = fixture.league.name;

          games.push({
            sport: "football",
            league: leagueName,
            league_icon: fixture.league.logo || null,
            home_team_name: fixture.teams.home.name,
            away_team_name: fixture.teams.away.name,
            home_team_logo: fixture.teams.home.logo || null,
            away_team_logo: fixture.teams.away.logo || null,
            home_team_score: fixture.goals.home,
            away_team_score: fixture.goals.away,
            start_time: fixture.fixture.date,
            status,
            venue: fixture.fixture.venue?.name || null,
            round: fixture.league.round || null,
            highlight: [71, 2, 13, 39, 140].includes(leagueId),
            api_source: "api-football",
            external_id: `apifb-${fixture.fixture.id}`,
            broadcast_channel: getChannel(leagueName, "football"),
          });
        }
      } catch (err) {
        console.error(`[API-Football] League ${leagueId} season ${season} error:`, err);
      }
    }
  }

  console.log(`[API-Football] Total: ${games.length} games`);
  return games;
}

// ===================== BALLDONTLIE =====================
async function fetchBasketball(apiKey: string): Promise<NormalizedGame[]> {
  const games: NormalizedGame[] = [];
  const today = new Date().toISOString().split("T")[0];

  console.log(`[BallDontLie] Fetching NBA games for ${today}`);

  try {
    const res = await fetch(
      `https://api.balldontlie.io/v1/games?dates[]=${today}`,
      { headers: { Authorization: apiKey } }
    );
    const data = await res.json();

    const gamesData = data.data || [];
    console.log(`[BallDontLie] Found ${gamesData.length} games`);

    for (const game of gamesData) {
      let status: "scheduled" | "live" | "finished" = "scheduled";
      if (game.status === "Final") status = "finished";
      else if (game.period > 0 && game.status !== "Final") status = "live";

      const isPlayoffs = game.postseason === true;

      games.push({
        sport: "basketball",
        league: "NBA",
        league_icon: "https://cdn.nba.com/logos/leagues/logo-nba.svg",
        home_team_name: game.home_team.full_name,
        away_team_name: game.visitor_team.full_name,
        home_team_logo: `https://cdn.nba.com/logos/nba/${game.home_team.id}/global/L/logo.svg`,
        away_team_logo: `https://cdn.nba.com/logos/nba/${game.visitor_team.id}/global/L/logo.svg`,
        home_team_score: game.home_team_score || null,
        away_team_score: game.visitor_team_score || null,
        start_time: game.date,
        status,
        venue: null,
        round: isPlayoffs ? "Playoffs" : "Temporada Regular",
        highlight: isPlayoffs,
        api_source: "balldontlie",
        external_id: `bdl-${game.id}`,
        broadcast_channel: getChannel("NBA", "basketball"),
      });
    }
  } catch (err) {
    console.error("[BallDontLie] error:", err);
  }

  console.log(`[BallDontLie] Total: ${games.length} games`);
  return games;
}

// ===================== MAIN HANDLER =====================
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const apiFootballKey = Deno.env.get("API_FOOTBALL_KEY");
    const balldontlieKey = Deno.env.get("BALLDONTLIE_KEY");

    console.log(`[Sync] API keys: football=${!!apiFootballKey}, basketball=${!!balldontlieKey}`);

    const results: { source: string; count: number; error?: string }[] = [];

    const [footballGames, basketballGames] = await Promise.allSettled([
      apiFootballKey ? fetchFootball(apiFootballKey) : Promise.resolve([]),
      balldontlieKey ? fetchBasketball(balldontlieKey) : Promise.resolve([]),
    ]);

    const allGames: NormalizedGame[] = [];

    if (footballGames.status === "fulfilled") {
      allGames.push(...footballGames.value);
      results.push({ source: "api-football", count: footballGames.value.length });
    } else {
      results.push({ source: "api-football", count: 0, error: String(footballGames.reason) });
    }

    if (basketballGames.status === "fulfilled") {
      allGames.push(...basketballGames.value);
      results.push({ source: "balldontlie", count: basketballGames.value.length });
    } else {
      results.push({ source: "balldontlie", count: 0, error: String(basketballGames.reason) });
    }

    console.log(`[Sync] Total: ${allGames.length} games from APIs`);

    if (allGames.length > 0) {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const { error: deleteErr } = await supabaseAdmin
        .from("games")
        .delete()
        .neq("api_source", "manual")
        .gte("start_time", startOfDay)
        .lt("start_time", endOfDay);

      if (deleteErr) console.error("[Sync] Delete error:", deleteErr);

      const { error: insertErr } = await supabaseAdmin.from("games").insert(allGames);

      if (insertErr) {
        console.error("[Sync] Insert error:", insertErr);
        return new Response(
          JSON.stringify({ success: false, error: insertErr.message, results }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, total: allGames.length, results, synced_at: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Sync] Fatal error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
