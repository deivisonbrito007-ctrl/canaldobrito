import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um extrator de programação esportiva. Receba a imagem e retorne SOMENTE o texto formatado, sem explicações.

Formato EXATO obrigatório:

📅**Dia DD/MM**

Time A x Time B
🏆 Competição (fase/detalhe se houver) / ⏰ HHhMM
📺 Canal1, Canal2

Time C x Time D
🏆 Competição / ⏰ HHhMM
📺 Canal1

Regras:
- Use "x" minúsculo para separar times
- Horário no formato HHhMM (ex: 19h00, 16h30)
- Se houver múltiplas datas, crie um bloco 📅 para cada
- Se o jogo for feminino, adicione (F) após o time visitante
- Liste TODOS os canais separados por vírgula
- NÃO adicione texto extra, apenas o formato acima
- Se não conseguir ler algum dado, use "?" como placeholder

Identificação de esportes:
- Para basquete (NBA, NBB, EuroLeague, WNBA), use 🏀 antes da competição
- Para tênis (ATP, WTA, Roland Garros, Wimbledon), use 🎾 antes da competição
- Para Fórmula 1, automobilismo e motovelocidade (F1, GP, Grande Prêmio, MotoGP, Moto2, Moto3, Formula E, E-Prix, IndyCar, Stock Car, Automobilismo), use 🏎️ antes da competição
- Para MMA (UFC, Bellator, PFL), use 🥊 antes da competição
- Para vôlei (Superliga, Liga das Nações), use 🏐 antes da competição
- Para futebol, use 🏆 normalmente (padrão)
Exemplo basquete: 🏀 NBA / ⏰ 22h00
Exemplo F1: 🏎️ Fórmula 1 (GP do Brasil) / ⏰ 14h00
Exemplo automobilismo: 🏎️ Automobilismo (Moto2) / ⏰ 10h00`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "Campo 'image' (base64) é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Extraia a programação esportiva desta imagem:" },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao processar imagem com IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("read-schedule-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
