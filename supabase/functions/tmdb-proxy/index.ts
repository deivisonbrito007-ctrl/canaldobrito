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
    const { action, query } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get TMDB API key from settings
    const { data: setting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "tmdb_api_key")
      .single();

    const apiKey = setting?.value;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "TMDB API key not configured. Set it in Settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const BASE = "https://api.themoviedb.org/3";
    let url = "";

    switch (action) {
      case "search_movie":
        url = `${BASE}/search/movie?query=${encodeURIComponent(query || "")}&language=pt-BR&api_key=${apiKey}`;
        break;
      case "search_tv":
        url = `${BASE}/search/tv?query=${encodeURIComponent(query || "")}&language=pt-BR&api_key=${apiKey}`;
        break;
      case "now_playing":
        url = `${BASE}/movie/now_playing?language=pt-BR&api_key=${apiKey}`;
        break;
      case "popular_tv":
        url = `${BASE}/tv/popular?language=pt-BR&api_key=${apiKey}`;
        break;
      case "movie_videos":
        url = `${BASE}/movie/${encodeURIComponent(query || "")}/videos?language=pt-BR&api_key=${apiKey}`;
        break;
      case "tv_videos":
        url = `${BASE}/tv/${encodeURIComponent(query || "")}/videos?language=pt-BR&api_key=${apiKey}`;
        break;
      case "movie_details":
        url = `${BASE}/movie/${encodeURIComponent(query || "")}?language=pt-BR&api_key=${apiKey}`;
        break;
      case "tv_details":
        url = `${BASE}/tv/${encodeURIComponent(query || "")}?language=pt-BR&api_key=${apiKey}`;
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `TMDB API error [${response.status}]: ${JSON.stringify(data)}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
