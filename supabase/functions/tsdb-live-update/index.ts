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

function bestScore(g: { home_team: string; away_team: string | null; sport_type?: string | null }, e: any): number {
  const isSingle = SINGLE_EVENT_SPORTS.has(g.sport_type || "") || !g.away_team;
  if (isSingle) {
    return Math.max(
      similarity(g.home_team, e.strEvent || ""),
      similarity(g.home_team, e.strHomeTeam || ""),
    );
  }
  const a = (similarity(g.home_team, e.strHomeTeam || "") + similarity(g.away_team || "", e.strAwayTeam || "")) / 2;
  const b = (similarity(g.home_team, e.strAwayTeam || "") + similarity(g.away_team || "", e.strHomeTeam || "")) / 2;
  return Math.max(a, b);
}

function todaySaoPaulo(): string {
  const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function deriveStatus(ev: any): "live" | "finished" | "scheduled" {
  const s = (ev.strStatus || ev.strProgress || "").toString().toLowerCase();
  if (/(ft|finished|match finished|aet|ended|final)/.test(s)) return "finished";
  if (/(ht|1h|2h|live|in play|q[1-4]|quarter|set|round|min|^\d)/.test(s)) return "live";
  return "scheduled";
}

function deriveMinute(ev: any): string | null {
  const p = (ev.strProgress || "").toString().trim();
  const s = (ev.strStatus || "").toString().trim();
  if (p) return p;
  if (s && s.toLowerCase() !== "ns") return s;
  return null;
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
      console.error("fetch failed", url, e);
    }
  }
  return collected;
}

async function fetchLivescore(sport?: string): Promise<any[]> {
  try {
    const path = sport ? `/livescore/${encodeURIComponent(sport)}` : `/livescore/all`;
    const r = await fetch(`${TSDB_V2}${path}`, {
      headers: { "X-API-KEY": TSDB_KEY },
    });
    if (!r.ok) {
      console.warn(`[live] v2 livescore${sport ? `/${sport}` : "/all"} status`, r.status);
      return [];
    }
    const j = await r.json();
    return j?.livescore || j?.events || [];
  } catch (e) {
    console.error("[live] v2 livescore failed", e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = todaySaoPaulo();
    const yesterday = new Date(Date.parse(today) - 86400000).toISOString().slice(0, 10);

    const { data: games, error } = await supabase
      .from("daily_games")
      .select("id, external_id, date, game_time, home_team, away_team, sport_type, live_status")
      .gte("date", yesterday).lte("date", today)
      .neq("archived", true);
    if (error) throw error;

    // Pre-fetch livescore by unique sport
    const sportsNeeded = new Set<string>();
    for (const g of (games || [])) {
      sportsNeeded.add(SPORT_MAP[g.sport_type || "football"] || "Soccer");
    }
    const liveBySport: Record<string, any[]> = {};
    for (const sp of sportsNeeded) {
      liveBySport[sp] = await fetchLivescore(sp);
      console.log(`[live] v2 livescore/${sp} → ${liveBySport[sp].length} events`);
    }

    const dayCache: Record<string, any[]> = {};
    async function getDay(date: string, sport: string) {
      const k = `${date}|${sport}`;
      if (!dayCache[k]) dayCache[k] = await fetchEventsForDate(date, sport);
      return dayCache[k];
    }

    const updates: any[] = [];
    const unmatched: string[] = [];
    let autoLinked = 0;

    for (const g of (games || [])) {
      try {
        let extId = (g.external_id || "").replace(/^tsdb:/, "");
        let ev: any = null;
        const tsdbSport = SPORT_MAP[g.sport_type || "football"] || "Soccer";
        const livescore = liveBySport[tsdbSport] || [];

        // 1) livescore (sport-filtered)
        if (livescore.length > 0) {
          const ranked = livescore
            .map((e: any) => ({ e, score: bestScore(g, e) }))
            .filter((c) => c.score >= 0.65)
            .sort((a, b) => b.score - a.score)[0];
          if (ranked) {
            ev = ranked.e;
            if (!extId && ev.idEvent) {
              extId = String(ev.idEvent);
              await supabase.from("daily_games").update({ external_id: `tsdb:${extId}` }).eq("id", g.id);
              autoLinked++;
              console.log(`[live] auto-linked "${g.home_team} vs ${g.away_team}" → "${ev.strEvent || `${ev.strHomeTeam} vs ${ev.strAwayTeam}`}" (${ranked.score.toFixed(2)})`);
            }
          }
        }

        // 2) eventsday fallback
        if (!extId && !ev) {
          const evs = await getDay(g.date, tsdbSport);
          const ranked = evs
            .map((e: any) => ({ e, score: bestScore(g, e) }))
            .filter((c) => c.score >= 0.65)
            .sort((a, b) => b.score - a.score)[0];
          if (ranked) {
            extId = String(ranked.e.idEvent);
            await supabase.from("daily_games").update({ external_id: `tsdb:${extId}` }).eq("id", g.id);
            autoLinked++;
            ev = ranked.e;
            console.log(`[live] day-linked "${g.home_team} vs ${g.away_team}" → "${ev.strEvent || `${ev.strHomeTeam} vs ${ev.strAwayTeam}`}" (${ranked.score.toFixed(2)})`);
          } else {
            const top = evs
              .map((e: any) => ({ e, score: bestScore(g, e) }))
              .sort((a, b) => b.score - a.score)[0];
            if (top && top.score > 0.3) {
              unmatched.push(`"${g.home_team} vs ${g.away_team}" → top "${top.e.strEvent || `${top.e.strHomeTeam} vs ${top.e.strAwayTeam}`}" (${top.score.toFixed(2)})`);
            } else {
              unmatched.push(`"${g.home_team} vs ${g.away_team}" → no candidate`);
            }
          }
        }

        // 3) lookup by extId
        if (extId && !ev) {
          const r = await fetch(`${TSDB_V1}/lookupevent.php?id=${extId}`);
          const j = await r.json();
          ev = j?.events?.[0];
        }

        if (!ev) continue;

        const home_score = ev.intHomeScore != null ? Number(ev.intHomeScore) : null;
        const away_score = ev.intAwayScore != null ? Number(ev.intAwayScore) : null;
        const live_status = deriveStatus(ev);
        const minute = deriveMinute(ev);

        const patch: any = {
          home_score,
          away_score,
          live_status,
          live_updated_at: new Date().toISOString(),
        };
        if (live_status === "live") patch.is_live = true;
        if (live_status === "finished") patch.is_live = false;
        if (minute) patch.elapsed_minutes = parseInt(minute, 10) || null;
        if (minute && /^(ht|halftime)/i.test(minute)) patch.status_short = "HT";
        else if (live_status === "finished") patch.status_short = "FT";
        else if (live_status === "live") patch.status_short = "LIVE";

        await supabase.from("daily_games").update(patch).eq("id", g.id);
        updates.push({ id: g.id, ...patch });
      } catch (e) {
        console.error("update failed", g.id, e);
      }
    }

    if (unmatched.length > 0) {
      console.log(`[live] unmatched (${unmatched.length}):\n  - ${unmatched.slice(0, 30).join("\n  - ")}`);
    }

    return new Response(
      JSON.stringify({
        updated: updates.length,
        autoLinked,
        unmatchedCount: unmatched.length,
        livescoreSports: Object.fromEntries(Object.entries(liveBySport).map(([k, v]) => [k, v.length])),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
