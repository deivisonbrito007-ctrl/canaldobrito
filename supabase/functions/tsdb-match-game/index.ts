// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TSDB_KEY = Deno.env.get("THESPORTSDB_KEY") ?? "3";
const TSDB_V1 = `https://www.thesportsdb.com/api/v1/json/${TSDB_KEY}`;
const TSDB_V2 = `https://www.thesportsdb.com/api/v2/json`;

const SPORT_MAP: Record<string, string> = {
  football: "Soccer",
  basketball: "Basketball",
  tennis: "Tennis",
  f1: "Motorsport",
  mma: "Fighting",
  boxing: "Fighting",
  volleyball: "Volleyball",
  hockey: "Ice Hockey",
  baseball: "Baseball",
  rugby: "Rugby",
  cycling: "Cycling",
  surf: "Surfing",
  swimming: "Aquatics",
  golf: "Golf",
};

const SINGLE_EVENT_SPORTS = new Set(["tennis", "f1", "mma", "boxing", "cycling", "surf", "swimming", "golf"]);

const ABBR: Record<string, string> = {
  "ind": "independiente", "dep": "deportivo", "depor": "deportivo",
  "univ": "universidad", "u": "universitario", "ac": "academia",
  "atl": "atletico", "atle": "atletico", "spt": "sporting",
  "rb": "red bull", "est": "estudiantes", "bar": "barcelona",
  "barca": "barcelona", "b": "bayern", "m": "montevideo",
  "intl": "international", "int": "internacional", "inter": "internazionale",
  "psg": "paris saint germain", "man": "manchester",
};

const STOP = new Set([
  "fc","cf","ec","sc","ac","cd","sa","aa","fk","sk","club","clube",
  "de","do","da","dos","das","the","united","city","atletico","atlético",
  "gremio","grêmio","futebol","football","del","la","el","los","las",
]);

const COUNTRY_SUFFIX = /[\s-]+(uru|equ|arg|bra|chi|col|par|per|ven|bol|usa|esp|por|ita|fra|ger|eng|mex|rj|sp|mg|rs|pr|sc|ba|ce|pe|am|go|al|w)$/i;

function norm(s: string): string {
  if (!s) return "";
  let cleaned = s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (let i = 0; i < 3; i++) {
    const after = cleaned.replace(COUNTRY_SUFFIX, "");
    if (after === cleaned) break;
    cleaned = after;
  }
  return cleaned
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .map((w) => ABBR[w] || w)
    .join(" ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .join(" ")
    .trim();
}

function similarity(a: string, b: string): number {
  const A = norm(a), B = norm(b);
  if (!A || !B) return 0;
  if (A === B) return 1;
  if (A.includes(B) || B.includes(A)) return 0.92;
  const aw = new Set(A.split(" ").filter((w) => w.length > 2));
  const bw = new Set(B.split(" ").filter((w) => w.length > 2));
  if (aw.size === 0 || bw.size === 0) return 0;
  let common = 0;
  for (const w of aw) if (bw.has(w)) common++;
  return common / Math.max(aw.size, bw.size);
}

async function fetchEventsForDate(date: string, sport: string): Promise<any[]> {
  const collected: any[] = [];
  const seen = new Set<string>();
  const urls = [
    `${TSDB_V1}/eventsday.php?d=${date}&s=${encodeURIComponent(sport)}`,
    `${TSDB_V1}/eventsday.php?d=${date}`,
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url);
      const j = await r.json();
      const evs: any[] = j?.events || [];
      for (const ev of evs) {
        if (sport && ev.strSport && ev.strSport !== sport) continue;
        if (seen.has(ev.idEvent)) continue;
        seen.add(ev.idEvent);
        collected.push(ev);
      }
    } catch (e) {
      console.error("[match] fetch failed", url, e);
    }
  }
  return collected;
}

async function fetchLivescoreV2(sport?: string): Promise<any[]> {
  try {
    const path = sport ? `/livescore/${encodeURIComponent(sport)}` : `/livescore/all`;
    const r = await fetch(`${TSDB_V2}${path}`, {
      headers: { "X-API-KEY": TSDB_KEY },
    });
    if (!r.ok) return [];
    const j = await r.json();
    return j?.livescore || j?.events || [];
  } catch {
    return [];
  }
}

function rankCandidates(
  game: { home_team: string; away_team: string | null; sport_type?: string | null },
  events: any[],
) {
  const isSingle = SINGLE_EVENT_SPORTS.has(game.sport_type || "") || !game.away_team;
  return events
    .map((ev) => {
      let score = 0;
      if (isSingle) {
        score = Math.max(
          similarity(game.home_team, ev.strEvent || ""),
          similarity(game.home_team, ev.strHomeTeam || ""),
        );
      } else {
        const a = (similarity(game.home_team, ev.strHomeTeam || "") + similarity(game.away_team || "", ev.strAwayTeam || "")) / 2;
        const b = (similarity(game.home_team, ev.strAwayTeam || "") + similarity(game.away_team || "", ev.strHomeTeam || "")) / 2;
        score = Math.max(a, b);
      }
      return {
        id: ev.idEvent,
        home: ev.strHomeTeam,
        away: ev.strAwayTeam,
        event: ev.strEvent,
        league: ev.strLeague,
        time: ev.strTime,
        score,
      };
    })
    .filter((c) => c.score > 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { gameId } = await req.json();
    if (!gameId) {
      return new Response(JSON.stringify({ error: "gameId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: game, error } = await supabase
      .from("daily_games")
      .select("id, date, home_team, away_team, sport_type")
      .eq("id", gameId)
      .single();
    if (error || !game) throw new Error(error?.message || "game not found");

    const tsdbSport = SPORT_MAP[game.sport_type || "football"] || "Soccer";

    // 1) eventsday
    const events = await fetchEventsForDate(game.date, tsdbSport);
    let candidates = rankCandidates(game, events);

    // 2) Fallback: v2 livescore filtered by sport
    if (!candidates[0] || candidates[0].score < 0.65) {
      const live = await fetchLivescoreV2(tsdbSport);
      const liveCandidates = rankCandidates(game, live);
      if (liveCandidates[0] && (!candidates[0] || liveCandidates[0].score > candidates[0].score)) {
        candidates = liveCandidates;
      }
    }

    console.log(`[match] ${game.home_team} vs ${game.away_team || "(single)"} (${tsdbSport}) top:`, JSON.stringify(candidates.slice(0, 3)));

    const best = candidates[0];
    if (best && best.score >= 0.65) {
      await supabase
        .from("daily_games")
        .update({ external_id: `tsdb:${best.id}` })
        .eq("id", gameId);
      return new Response(
        JSON.stringify({ matched: true, external_id: `tsdb:${best.id}`, candidates, totalEvents: events.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ matched: false, candidates, totalEvents: events.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[match] error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
