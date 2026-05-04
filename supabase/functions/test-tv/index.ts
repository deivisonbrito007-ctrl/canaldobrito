// Teste rápido: chama eventstv.php com a chave premium do usuário
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (_req) => {
  const apiKey = Deno.env.get("THESPORTSDB_KEY")!;
  const r = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/eventstv.php?d=2026-05-04`);
  const j = await r.json();
  return new Response(JSON.stringify({
    ok: true,
    count: Array.isArray(j?.tvevent) ? j.tvevent.length : 0,
    sample: Array.isArray(j?.tvevent) ? j.tvevent.slice(0, 3) : null,
    raw: !Array.isArray(j?.tvevent) ? j : undefined,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
