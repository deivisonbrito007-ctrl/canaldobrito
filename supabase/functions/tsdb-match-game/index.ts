// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TSDB_KEY = Deno.env.get("THESPORTSDB_KEY") ?? "3";
const TSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${TSDB_KEY}`;

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

const STOP = new Set([
  "fc","cf","ec","sc","ac","cd","sa","aa","fk","sk","club","clube",
  "de","do","da","dos","das","the","united","city","atletico","atlético",
  "gremio","grêmio","futebol","football",
]);

const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .join(" ")
    .trim();

function similarity(a: string, b: string): number {
  const A = norm(a);
  const B = norm(b);
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

export async function fetchEventsForDate(date: string, sport: string): Promise<any[]> {
  const collected: any[] = [];
  const seen = new Set<string>();
  const urls = [
    `${TSDB_BASE}/eventsday.php?d=${date}&s=${encodeURIComponent(sport)}`,
    `${TSDB_BASE}/eventsday.php?d=${date}`,
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

export function rankCandidates(game: { home_team: string; away_team: string | null }, events: any[]) {
  return events
    .map((ev) => {
      const homeSim = similarity(game.home_team, ev.strHomeTeam || "");
      const awaySim = similarity(game.away_team || "", ev.strAwayTeam || "");
      const swapped =
        (similarity(game.home_team, ev.strAwayTeam || "") +
          similarity(game.away_team || "", ev.strHomeTeam || "")) / 2;
      const score = Math.max((homeSim + awaySim) / 2, swapped);
      return {
        id: ev.idEvent,
        home: ev.strHomeTeam,
        away: ev.strAwayTeam,
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
    const events = await fetchEventsForDate(game.date, tsdbSport);
    const keyHint = TSDB_KEY.length > 4 ? `${TSDB_KEY.slice(0, 2)}…(${TSDB_KEY.length})` : TSDB_KEY;
    console.log(`[match] key=${keyHint} ${game.home_team} vs ${game.away_team} (${tsdbSport}) — ${events.length} events on ${game.date}`);

    const candidates = rankCandidates(game, events);
    console.log(`[match] top:`, JSON.stringify(candidates.slice(0, 3)));

    const best = candidates[0];
    if (best && best.score >= 0.8) {
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
