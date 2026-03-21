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

    // Cleanup: remove games from past dates
    const { data: deletedGames, error: cleanupError } = await supabase
      .from("daily_games")
      .delete()
      .lt("date", new Date().toISOString().split("T")[0])
      .select("id");

    if (cleanupError) {
      console.error("Error cleaning old games:", cleanupError);
    }

    const result = {
      activated_banners: activatedBanners?.length || 0,
      activated_games: activatedGames?.length || 0,
      cleaned_old_games: deletedGames?.length || 0,
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
