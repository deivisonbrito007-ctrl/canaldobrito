import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Channel mapping by league name
const CHANNEL_MAP: Record<string, string> = {
  // Football
  "Serie A": "Premiere / Globo",
  "Brasileirão Série A": "Premiere / Globo",
  "Copa Do Brasil": "Globo / SporTV / Amazon Prime",
  "Copa Libertadores": "ESPN / Paramount+",
  "UEFA Champions League": "TNT Sports / Max",
  "Champions League": "TNT Sports / Max",
  "Premier League": "ESPN / Star+",
  "La Liga": "ESPN / Star+",
  "Serie A": "ESPN / Star+",
  "Ligue 1": "CazéTV",
  "Bundesliga": "CazéTV / OneFootball",
  "Copa America": "Globo / SporTV",
  // Basketball
  "NBA": "ESPN / TNT Sports",
  // Esports
  "CS2": "YouTube / Twitch",
  "LoL": "YouTube / Twitch",
  "Valorant": "YouTube / Twitch",
  "Dota 2": "YouTube / Twitch",
  // MMA
  "UFC": "Combate / UFC Fight Pass",
};

function getChannel(league: string, sport: string): string | null {
  // Direct match
  if (CHANNEL_MAP[league]) return CHANNEL_MAP[league];
  // Partial match
  for (const [key, channel] of Object.entries(CHANNEL_MAP)) {
    if (league.toLowerCase().includes(key.toLowerCase())) return channel;
  }
  // Sport-level defaults
  if (sport === "basketball") return "ESPN / TNT Sports";
  if (sport === "esports") return "YouTube / Twitch";
  if (sport === "mma") return "Combate / UFC Fight Pass";
  return null;
}

// Types
interface NormalizedGame {
  sport: "football" | "basketball" | "esports" | "mma";
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
  api_source: "api-football" | "balldontlie" | "pandascore";
  external_id: string;
  broadcast_channel: string | null;
}

// ===================== API-FOOTBALL =====================
async function fetchFootball(apiKey: string): Promise<NormalizedGame[]> {
  const games: NormalizedGame[] = [];
  const today = new Date().toISOString().split("T")[0];

  const leagues = [71, 2, 73, 13, 39, 140, 135, 61, 78];

  for (const leagueId of leagues) {
    try {
      const res = await fetch(
        `https://v3.football.api-sports.io/fixtures?date=${today}&league=${leagueId}&season=${new Date().getFullYear()}`,
        { headers: { "x-apisports-key": apiKey } }
      );
      const data = await res.json();

      if (data.response) {
        for (const fixture of data.response) {
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
            highlight: [2, 39, 140, 135].includes(leagueId),
            api_source: "api-football",
            external_id: `apifb-${fixture.fixture.id}`,
            broadcast_channel: getChannel(leagueName, "football"),
          });
        }
      }
    } catch (err) {
      console.error(`API-Football league ${leagueId} error:`, err);
    }
  }
  return games;
}

// ===================== BALLDONTLIE =====================
async function fetchBasketball(apiKey: string): Promise<NormalizedGame[]> {
  const games: NormalizedGame[] = [];
  const today = new Date().toISOString().split("T")[0];

  try {
    const res = await fetch(
      `https://api.balldontlie.io/v1/games?dates[]=${today}`,
      { headers: { Authorization: apiKey } }
    );
    const data = await res.json();

    if (data.data) {
      for (const game of data.data) {
        let status: "scheduled" | "live" | "finished" = "scheduled";
        if (game.status === "Final") status = "finished";
        else if (game.period > 0 && game.status !== "Final") status = "live";

        const isPlayoffs = game.postseason === true;

        // NBA team logo URLs from cdn.nba.com
        const homeAbbr = game.home_team.abbreviation;
        const awayAbbr = game.visitor_team.abbreviation;

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
    }
  } catch (err) {
    console.error("BALLDONTLIE error:", err);
  }
  return games;
}

// ===================== PANDASCORE =====================
async function fetchEsports(apiKey: string): Promise<NormalizedGame[]> {
  const games: NormalizedGame[] = [];
  const today = new Date().toISOString().split("T")[0];

  const videogames = ["csgo", "lol", "valorant", "dota2"];

  for (const vg of videogames) {
    try {
      const res = await fetch(
        `https://api.pandascore.co/${vg}/matches?filter[begin_at]=${today}&sort=begin_at&per_page=10`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      const data = await res.json();

      if (Array.isArray(data)) {
        for (const match of data) {
          let status: "scheduled" | "live" | "finished" = "scheduled";
          if (match.status === "running") status = "live";
          else if (match.status === "finished") status = "finished";

          const opponents = match.opponents || [];
          const homeName = opponents[0]?.opponent?.name || "TBD";
          const awayName = opponents[1]?.opponent?.name || "TBD";
          const homeLogo = opponents[0]?.opponent?.image_url || null;
          const awayLogo = opponents[1]?.opponent?.image_url || null;

          const results = match.results || [];
          const homeScore = results[0]?.score ?? null;
          const awayScore = results[1]?.score ?? null;

          const sportLabels: Record<string, string> = { csgo: "CS2", lol: "LoL", valorant: "Valorant", dota2: "Dota 2" };
          const sportLabel = sportLabels[vg] || vg;
          const tournamentName = match.tournament?.name || match.league?.name || sportLabel;
          const leagueIcon = match.league?.image_url || null;

          games.push({
            sport: "esports",
            league: `${sportLabel} — ${tournamentName}`,
            league_icon: leagueIcon,
            home_team_name: homeName,
            away_team_name: awayName,
            home_team_logo: homeLogo,
            away_team_logo: awayLogo,
            home_team_score: homeScore,
            away_team_score: awayScore,
            start_time: match.begin_at || match.scheduled_at || new Date().toISOString(),
            status,
            venue: null,
            round: match.match_type || null,
            highlight: match.tournament?.tier === "s" || false,
            api_source: "pandascore",
            external_id: `ps-${match.id}`,
            broadcast_channel: getChannel(sportLabel, "esports"),
          });
        }
      }
    } catch (err) {
      console.error(`PandaScore ${vg} error:`, err);
    }
  }
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

    // Fetch API keys
    const apiFootballKey = Deno.env.get("API_FOOTBALL_KEY");
    const balldontlieKey = Deno.env.get("BALLDONTLIE_KEY");
    const pandascoreKey = Deno.env.get("PANDASCORE_KEY");

    const results: { source: string; count: number; error?: string }[] = [];

    const [footballGames, basketballGames, esportsGames] = await Promise.allSettled([
      apiFootballKey ? fetchFootball(apiFootballKey) : Promise.resolve([]),
      balldontlieKey ? fetchBasketball(balldontlieKey) : Promise.resolve([]),
      pandascoreKey ? fetchEsports(pandascoreKey) : Promise.resolve([]),
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

    if (esportsGames.status === "fulfilled") {
      allGames.push(...esportsGames.value);
      results.push({ source: "pandascore", count: esportsGames.value.length });
    } else {
      results.push({ source: "pandascore", count: 0, error: String(esportsGames.reason) });
    }

    console.log(`Fetched ${allGames.length} games total from APIs`);

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

      if (deleteErr) console.error("Delete error:", deleteErr);

      const { error: insertErr } = await supabaseAdmin.from("games").insert(allGames);

      if (insertErr) {
        console.error("Insert error:", insertErr);
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
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
