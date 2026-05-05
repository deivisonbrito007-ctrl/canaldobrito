// Atualiza is_live / status_short / elapsed_minutes de jogos vindos do TheSportsDB.
// Usa V2 livescore (premium). Roda a cada 5 min via cron.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SPORTS = [
  "Soccer", "Basketball", "Tennis", "Motorsport", "Fighting",
  "Volleyball", "Ice Hockey", "Baseball", "American Football",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("THESPORTSDB_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "THESPORTSDB_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const todayBRT = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date());

    const { data: todays, error: qErr } = await supabase
      .from("daily_games")
      .select("external_id")
      .eq("date", todayBRT)
      .eq("source", "thesportsdb")
      .not("external_id", "is", null);
    if (qErr) throw qErr;

    if (!todays || todays.length === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: "no thesportsdb games today" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const tracked = new Set(todays.map((t: any) => t.external_id));
    const liveExt: string[] = [];
    let updated = 0;
    const errs: string[] = [];

    for (const sport of SPORTS) {
      const r = await fetch(
        `https://www.thesportsdb.com/api/v2/json/livescore/${encodeURIComponent(sport)}`,
        { headers: { "X-API-KEY": apiKey } },
      );
      if (!r.ok) { errs.push(`${sport}: HTTP ${r.status}`); continue; }
      const j = await r.json();
      const events = Array.isArray(j?.livescore) ? j.livescore : (Array.isArray(j?.events) ? j.events : []);
      for (const ev of events) {
        const extId = `tsdb:${ev.idEvent}`;
        if (!tracked.has(extId)) continue;
        const status = (ev.strStatus || "LIVE").toString().slice(0, 16);
        const progress = ev.strProgress || "";
        const elapsed = (() => {
          const m = String(progress).match(/(\d+)/);
          return m ? Number(m[1]) : null;
        })();
        const isLive = !["FT", "AOT", "AP", "PP", "CANC", "POSTP"].includes(status.toUpperCase());
        liveExt.push(extId);
        const { error } = await supabase.from("daily_games").update({
          is_live: isLive, status_short: status, elapsed_minutes: elapsed,
        }).eq("external_id", extId);
        if (!error) updated++;
      }
    }

    // Marca como não-live os que saíram da lista
    const stillLive = new Set(liveExt);
    const toFinish = todays.map((t: any) => t.external_id).filter((id: string) => id && !stillLive.has(id));
    if (toFinish.length > 0) {
      await supabase.from("daily_games")
        .update({ is_live: false }).in("external_id", toFinish).eq("is_live", true);
    }

    try {
      await supabase.from("audit_logs").insert({
        action: "api_live_update_run",
        entity: "daily_games",
        actor_id: null,
        payload: {
          source: "thesportsdb",
          todaysGames: todays.length,
          updated,
          live_count: liveExt.length,
          finished: toFinish.length,
          errors_count: errs.length,
          errors: errs.slice(0, 10),
          triggered_by: req.headers.get("x-cron-secret") ? "cron" : "manual",
        },
      });
    } catch (logErr) {
      console.error("[update-live-thesportsdb] audit log failed:", logErr);
    }

    return new Response(JSON.stringify({
      ok: true, todaysGames: todays.length, updated, errors: errs,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[update-live-thesportsdb]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
