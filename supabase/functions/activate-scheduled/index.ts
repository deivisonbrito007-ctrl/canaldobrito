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

    // Activate daily_games where publish_at <= now() and active = false
    const { data: activatedGames, error: gamesError } = await supabase
      .from("daily_games")
      .update({ active: true, publish_at: null })
      .eq("active", false)
      .not("publish_at", "is", null)
      .lte("publish_at", new Date().toISOString())
      .select("id");

    if (gamesError) {
      console.error("Error activating daily_games:", gamesError);
    }

    // Cleanup: remove games older than 2 days (Brazil timezone)
    // This gives a safety margin so games from yesterday are kept
    const cleanupDate = new Date(nowBR);
    cleanupDate.setDate(cleanupDate.getDate() - 2);
    const cleanupDateStr = cleanupDate.toISOString().split("T")[0];

    // Log what will be deleted before deleting
    const { data: gamesToDelete } = await supabase
      .from("daily_games")
      .select("id, date, home_team, away_team")
      .lt("date", cleanupDateStr);

    if (gamesToDelete?.length) {
      console.log(`Will delete ${gamesToDelete.length} old games:`, gamesToDelete.map(g => `${g.date}: ${g.home_team} x ${g.away_team} (${g.id})`));
    }

    const { data: deletedGames, error: cleanupError } = await supabase
      .from("daily_games")
      .delete()
      .lt("date", cleanupDateStr)
      .select("id");

    if (cleanupError) {
      console.error("Error cleaning old games:", cleanupError);
    }

    const result = {
      activated_banners: activatedBanners?.length || 0,
      activated_games: activatedGames?.length || 0,
      cleaned_old_games: deletedGames?.length || 0,
      today_br: todayBR,
      cleanup_before: cleanupDateStr,
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
