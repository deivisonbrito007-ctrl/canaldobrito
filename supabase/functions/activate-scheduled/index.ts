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

    // Daily cleanup: retain today and all future schedules in São Paulo time.
    const { data: deletedGames, error: deleteError } = await supabase
      .from("daily_games")
      .delete()
      .lt("date", todayBR)
      .select("id");

    if (deleteError) {
      console.error("Error deleting old archived games:", deleteError);
    }

    if ((deletedGames?.length || 0) > 0) {
      const { error: auditError } = await supabase.from("audit_logs").insert({
        action: "cleanup_old_schedules",
        entity: "daily_games",
        payload: { deleted_count: deletedGames?.length || 0, retained_from: todayBR },
      });
      if (auditError) console.error("Error logging schedule cleanup:", auditError);
    }

    const result = {
      activated_banners: activatedBanners?.length || 0,
      deactivated_expired_banners: expiredBanners?.length || 0,
      activated_games: activatedGames?.length || 0,
      deleted_old_games: deletedGames?.length || 0,
      today_br: todayBR,
      retained_from: todayBR,
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
