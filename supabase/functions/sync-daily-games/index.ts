import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHANNEL_MAP: Record<string, string[]> = {
  "UEFA Champions League": ["TNT", "Max"],
  "Copa Libertadores": ["ESPN", "Disney+"],
  "Copa Sul-Americana": ["ESPN", "Disney+"],
  "Serie A": ["Sportv", "Premiere"],
  "Copa do Brasil": ["Sportv", "Premiere", "Globo"],
  "Premier League": ["ESPN", "Disney+"],
  "La Liga": ["ESPN", "Disney+"],
  "Serie A (Italy)": ["ESPN", "Disney+"],
  "Bundesliga": ["CazéTV", "Sportv"],
  "Ligue 1": ["CazéTV"],
  "UEFA Europa League": ["CazéTV"],
  "UEFA Conference League": ["CazéTV"],
};

function guessChannels(leagueName: string): string[] {
  const key = leagueName.trim();
  for (const [k, v] of Object.entries(CHANNEL_MAP)) {
    if (key.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return [];
}

function isWomens(home: string, away: string, leagueName: string): boolean {
  const combined = `${home} ${away} ${leagueName}`.toLowerCase();
  return combined.includes("(w)") || combined.includes("women") || combined.includes("feminino");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_FOOTBALL_KEY = Deno.env.get("API_FOOTBALL_KEY");
    if (!API_FOOTBALL_KEY) {
      return new Response(JSON.stringify({ error: "API_FOOTBALL_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { date } = await req.json();
    if (!date) {
      return new Response(JSON.stringify({ error: "date is required (YYYY-MM-DD)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch fixtures from API-Football
    const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${date}&timezone=America/Sao_Paulo`;
    const apiRes = await fetch(apiUrl, {
      headers: { "x-apisports-key": API_FOOTBALL_KEY },
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return new Response(JSON.stringify({ error: `API-Football error [${apiRes.status}]: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiData = await apiRes.json();
    const fixtures = apiData.response || [];

    // Build records
    const records = fixtures.map((f: any) => {
      const homeTeam = f.teams?.home?.name || "TBD";
      const awayTeam = f.teams?.away?.name || "TBD";
      const leagueName = f.league?.name || "";
      const leagueRound = f.league?.round || "";
      const fixtureDate = new Date(f.fixture?.date);
      const hours = String(fixtureDate.getHours()).padStart(2, "0");
      const minutes = String(fixtureDate.getMinutes()).padStart(2, "0");
      const gameTime = `${hours}:${minutes}`;
      const statusShort = f.fixture?.status?.short || "";
      const isLive = ["1H", "HT", "2H", "ET", "P", "LIVE"].includes(statusShort);

      return {
        date,
        home_team: homeTeam,
        away_team: awayTeam,
        competition: leagueName,
        competition_detail: leagueRound,
        game_time: gameTime,
        channels: guessChannels(leagueName),
        is_live: isLive,
        is_womens: isWomens(homeTeam, awayTeam, leagueName),
        active: true,
        status_short: statusShort || "NS",
        elapsed_minutes: f.fixture?.status?.elapsed ?? null,
      };
    });

    // Insert into Supabase (upsert-like: delete existing for date, then insert)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Delete existing games for this date to avoid duplicates
    await supabase.from("daily_games").delete().eq("date", date);

    let inserted = 0;
    if (records.length > 0) {
      // Insert in batches of 100
      for (let i = 0; i < records.length; i += 100) {
        const batch = records.slice(i, i + 100);
        const { error } = await supabase.from("daily_games").insert(batch);
        if (error) {
          console.error("Insert error:", error);
        } else {
          inserted += batch.length;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, total_fixtures: fixtures.length, inserted }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("sync-daily-games error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
