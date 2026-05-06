// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TSDB_KEY = Deno.env.get("THESPORTSDB_KEY") ?? "3";
const TSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${TSDB_KEY}`;

// America/Sao_Paulo today (UTC-3)
function todaySaoPaulo(): string {
  const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function deriveStatus(ev: any): "live" | "finished" | "scheduled" {
  const s = (ev.strStatus || ev.strProgress || "").toString().toLowerCase();
  if (/(ft|finished|match finished|aet|ended|final)/.test(s)) return "finished";
  if (/(ht|1h|2h|live|in play|q[1-4]|quarter|set|round|min)/.test(s)) return "live";
  if (ev.intHomeScore != null && ev.intAwayScore != null && s === "ns") return "scheduled";
  if (s === "ns" || s === "" || s === "not started") return "scheduled";
  return "live"; // default when we have a status but unrecognized
}

function deriveMinute(ev: any): string | null {
  const p = (ev.strProgress || "").toString().trim();
  const s = (ev.strStatus || "").toString().trim();
  if (p) return p;
  if (s && s.toLowerCase() !== "ns") return s;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = todaySaoPaulo();

    // Pick games from today (or yesterday for late-night matches) that are linked
    const { data: games, error } = await supabase
      .from("daily_games")
      .select("id, external_id, date, game_time, live_status")
      .not("external_id", "is", null)
      .gte("date", new Date(Date.parse(today) - 86400000).toISOString().slice(0, 10))
      .lte("date", today)
      .neq("live_status", "finished");

    if (error) throw error;

    const updates: any[] = [];
    for (const g of games || []) {
      const id = (g.external_id || "").replace(/^tsdb:/, "");
      if (!id) continue;
      try {
        const r = await fetch(`${TSDB_BASE}/lookupevent.php?id=${id}`);
        const j = await r.json();
        const ev = j?.events?.[0];
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

    return new Response(JSON.stringify({ updated: updates.length, updates }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
