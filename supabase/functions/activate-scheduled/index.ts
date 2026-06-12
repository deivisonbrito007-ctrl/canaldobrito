import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Use Brazil timezone for all date comparisons
    const nowBR = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const todayBR = nowBR.toISOString().split("T")[0];

    // Activate banners where publish_at <= now() and active = false
    const { data: activatedBanners, error: bannersError } = await supabase
      .from("banners")
      .update({ active: true, publish_at: null })
      .eq("active", false)
      .not("publish_at", "is", null)
      .lte("publish_at", new Date().toISOString())
      .select("id");

    if (bannersError) {
      console.error("Error activating banners:", bannersError);
    }

    // Deactivate banners whose expires_at has passed
    const { data: expiredBanners, error: expiredBannersError } = await supabase
      .from("banners")
      .update({ active: false })
      .eq("active", true)
      .not("expires_at", "is", null)
      .lte("expires_at", new Date().toISOString())
      .select("id");

    if (expiredBannersError) {
      console.error("Error deactivating expired banners:", expiredBannersError);
    }

    // Activate daily_games where publish_at <= now() and active = false
    const { data: activatedGames, error: gamesError } = await supabase
      .from("daily_games")
      .update({ active: true, publish_at: null })
      .eq("active", false)
      .eq("archived", false)
      .not("publish_at", "is", null)
      .lte("publish_at", new Date().toISOString())
      .select("id");

    if (gamesError) {
      console.error("Error activating daily_games:", gamesError);
    }

    // Soft delete: archive games older than 2 days (Brazil timezone)
    const archiveDate = new Date(nowBR);
    archiveDate.setDate(archiveDate.getDate() - 2);
    const archiveDateStr = archiveDate.toISOString().split("T")[0];

    const { data: gamesToArchive } = await supabase
      .from("daily_games")
      .select("id, date, home_team, away_team")
      .eq("archived", false)
      .lt("date", archiveDateStr);

    if (gamesToArchive?.length) {
      console.log(`Archiving ${gamesToArchive.length} old games:`, gamesToArchive.map(g => `${g.date}: ${g.home_team} x ${g.away_team} (${g.id})`));
    }

    const { data: archivedGames, error: archiveError } = await supabase
      .from("daily_games")
      .update({ archived: true, active: false })
      .eq("archived", false)
      .lt("date", archiveDateStr)
      .select("id");

    if (archiveError) {
      console.error("Error archiving old games:", archiveError);
    }

    // Hard delete: permanently remove games archived for more than 30 days
    const hardDeleteDate = new Date(nowBR);
    hardDeleteDate.setDate(hardDeleteDate.getDate() - 30);
    const hardDeleteDateStr = hardDeleteDate.toISOString().split("T")[0];

    const { data: deletedGames, error: deleteError } = await supabase
      .from("daily_games")
      .delete()
      .eq("archived", true)
      .lt("date", hardDeleteDateStr)
      .select("id");

    if (deleteError) {
      console.error("Error deleting old archived games:", deleteError);
    }

    const result = {
      activated_banners: activatedBanners?.length || 0,
      activated_games: activatedGames?.length || 0,
      archived_games: archivedGames?.length || 0,
      hard_deleted_games: deletedGames?.length || 0,
      today_br: todayBR,
      archive_before: archiveDateStr,
      hard_delete_before: hardDeleteDateStr,
      checked_at: new Date().toISOString(),
    };

    console.log("Activation check:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
