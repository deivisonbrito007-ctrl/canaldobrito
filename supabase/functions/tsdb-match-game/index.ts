// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TSDB_KEY = Deno.env.get("THESPORTSDB_KEY") ?? "3";
const TSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${TSDB_KEY}`;

// Sport mapping (PT app -> TSDB "sport" param for eventsday.php)
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

const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function similarity(a: string, b: string): number {
  const A = norm(a);
  const B = norm(b);
  if (!A || !B) return 0;
  if (A === B) return 1;
  if (A.includes(B) || B.includes(A)) return 0.9;
  const aw = new Set(A.split(" "));
  const bw = new Set(B.split(" "));
  let common = 0;
  for (const w of aw) if (bw.has(w)) common++;
  return common / Math.max(aw.size, bw.size);
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
    const url = `${TSDB_BASE}/eventsday.php?d=${game.date}&s=${encodeURIComponent(tsdbSport)}`;
    const res = await fetch(url);
    const json = await res.json();
    const events: any[] = json?.events || [];

    const candidates = events
      .map((ev) => {
        const homeSim = similarity(game.home_team, ev.strHomeTeam || "");
        const awaySim = similarity(game.away_team, ev.strAwayTeam || "");
        const swapped =
          (similarity(game.home_team, ev.strAwayTeam || "") +
            similarity(game.away_team, ev.strHomeTeam || "")) / 2;
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
      .filter((c) => c.score > 0.45)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const best = candidates[0];
    if (best && best.score >= 0.85) {
      await supabase
        .from("daily_games")
        .update({ external_id: `tsdb:${best.id}` })
        .eq("id", gameId);
      return new Response(
        JSON.stringify({ matched: true, external_id: `tsdb:${best.id}`, candidates }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ matched: false, candidates }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
