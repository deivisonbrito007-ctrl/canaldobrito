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

const STOP = new Set(["fc","cf","ec","sc","ac","cd","sa","aa","fk","sk","club","clube","de","do","da","dos","das","the","united","city","atletico","atlético","gremio","grêmio","futebol","football"]);
const norm = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w)).join(" ").trim();

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

async function fetchLivescoreV2(): Promise<any[]> {
  try {
    const r = await fetch(`${TSDB_V2}/livescore/all`, {
      headers: { "X-API-KEY": TSDB_KEY },
    });
    if (!r.ok) {
      console.warn("[live] v2 livescore status", r.status);
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

    // 1) All games today/yesterday (linked or not)
    const { data: games, error } = await supabase
      .from("daily_games")
      .select("id, external_id, date, game_time, home_team, away_team, sport_type, live_status")
      .gte("date", yesterday).lte("date", today)
      .neq("archived", true);
    if (error) throw error;

    // 2) Pre-fetch v2 livescore once (covers running matches across sports)
    const livescore = await fetchLivescoreV2();
    console.log(`[live] v2 livescore returned ${livescore.length} events`);

    // 3) Pre-fetch eventsday (Soccer + all) for both dates — used for auto-link of unlinked games
    const dayCache: Record<string, any[]> = {};
    async function getDay(date: string, sport: string) {
      const k = `${date}|${sport}`;
      if (!dayCache[k]) dayCache[k] = await fetchEventsForDate(date, sport);
      return dayCache[k];
    }

    const updates: any[] = [];
    let autoLinked = 0;

    for (const g of (games || [])) {
      try {
        let extId = (g.external_id || "").replace(/^tsdb:/, "");
        let ev: any = null;

        // Try livescore by team-name match first
        if (livescore.length > 0) {
          const found = livescore
            .map((e: any) => {
              const a = (similarity(g.home_team, e.strHomeTeam || "") + similarity(g.away_team || "", e.strAwayTeam || "")) / 2;
              const b = (similarity(g.home_team, e.strAwayTeam || "") + similarity(g.away_team || "", e.strHomeTeam || "")) / 2;
              return { e, score: Math.max(a, b) };
            })
            .filter((c) => c.score >= 0.8)
            .sort((a, b) => b.score - a.score)[0];
          if (found) {
            ev = found.e;
            if (!extId && ev.idEvent) {
              extId = String(ev.idEvent);
              await supabase.from("daily_games").update({ external_id: `tsdb:${extId}` }).eq("id", g.id);
              autoLinked++;
            }
          }
        }

        // If still unlinked, try auto-match via eventsday (only when game is in live window ±15min)
        if (!extId && !ev) {
          const tsdbSport = SPORT_MAP[g.sport_type || "football"] || "Soccer";
          const evs = await getDay(g.date, tsdbSport);
          const candidates = evs
            .map((e: any) => {
              const a = (similarity(g.home_team, e.strHomeTeam || "") + similarity(g.away_team || "", e.strAwayTeam || "")) / 2;
              const b = (similarity(g.home_team, e.strAwayTeam || "") + similarity(g.away_team || "", e.strHomeTeam || "")) / 2;
              return { e, score: Math.max(a, b) };
            })
            .filter((c) => c.score >= 0.8)
            .sort((a, b) => b.score - a.score);
          const best = candidates[0];
          if (best) {
            extId = String(best.e.idEvent);
            await supabase.from("daily_games").update({ external_id: `tsdb:${extId}` }).eq("id", g.id);
            autoLinked++;
            ev = best.e;
          }
        }

        // If we have an extId but no ev yet, fetch lookupevent
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

    return new Response(JSON.stringify({ updated: updates.length, autoLinked, livescoreCount: livescore.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
