import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um extrator de programação esportiva. Receba a imagem ou texto e retorne SOMENTE o texto formatado, sem explicações.

Formato EXATO obrigatório:

📅**Dia DD/MM**

FORMATO A — Jogos com dois adversários (futebol, basquete, vôlei):
Time A x Time B
🏆 Competição (fase/detalhe se houver) / ⏰ HHhMM
📺 Canal1, Canal2

FORMATO B — Esportes individuais ou de evento SEM adversário direto (tênis, F1, automobilismo, MMA, boxe, atletismo, natação, surfe, skate):
Nome do Evento ou Torneio
🎾 Competição (detalhe) / ⏰ HHhMM
📺 Canal1

⚠️ REGRAS CRÍTICAS:
- Para esportes do FORMATO B, NÃO invente adversários. NÃO use "x ?" ou "x TBD" ou "x A DEFINIR". Use APENAS o nome do evento/torneio na primeira linha.
- NUNCA coloque "x ?" em hipótese alguma. Se não há adversário, use FORMATO B.
- Se houver múltiplos esportes no mesmo horário, liste CADA UM separadamente como entrada própria.
- Inclua SEMPRE o detalhe entre parênteses quando disponível: fase, rodada, etapa, local do torneio (ex: "oitavas de final", "Indian Wells", "Classificação", "Card Principal").

Regras gerais:
- Use "x" minúsculo para separar times APENAS no formato A
- Horário no formato HHhMM (ex: 19h00, 16h30)
- Se houver múltiplas datas, crie um bloco 📅 para cada
- Se o jogo for feminino, adicione (F) após o time visitante
- Liste TODOS os canais separados por vírgula
- NÃO adicione texto extra, apenas o formato acima
- Se não conseguir ler algum dado, use "?" como placeholder APENAS para times, horários ou canais — NUNCA como adversário em esportes individuais

Identificação de esportes:
- Para basquete (NBA, NBB, EuroLeague, WNBA, ACB, Liga Endesa), use 🏀 antes da competição → FORMATO A
- Para tênis (ATP, WTA, Roland Garros, Wimbledon, US Open, Australian Open, Masters, Grand Slam), use 🎾 antes da competição → FORMATO B
- Para Fórmula 1, automobilismo e motovelocidade (F1, GP, Grande Prêmio, MotoGP, Moto2, Moto3, Formula E, E-Prix, IndyCar, Stock Car, Automobilismo), use 🏎️ antes da competição → FORMATO B
- Para MMA e luta (UFC, Bellator, PFL, Boxing, Boxe), use 🥊 antes da competição → FORMATO B
- Para vôlei (Superliga, Liga das Nações, Champions), use 🏐 antes da competição → FORMATO A
- Para futebol, use 🏆 normalmente (padrão) → FORMATO A

Exemplos formato A:
Flamengo x Palmeiras
🏆 Brasileirão (oitavas de final) / ⏰ 19h00
📺 Sportv

Lakers x Celtics
🏀 NBA (Playoffs - 1ª rodada) / ⏰ 22h00
📺 ESPN

Exemplos formato B:
ATP e WTA
🎾 Tênis (Indian Wells - 3ª rodada) / ⏰ 20h00
📺 ESPN 2

GP da Arábia Saudita
🏎️ Fórmula 1 (Classificação) / ⏰ 13h00
📺 Band, BandSports

UFC 315
🥊 MMA (Card Principal) / ⏰ 23h00
📺 Combate`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { image, text } = body;

    if (!image && !text) {
      return new Response(JSON.stringify({ error: "Campo 'image' (base64) ou 'text' é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build user message content
    const userContent: any[] = [];

    if (text) {
      userContent.push({
        type: "text",
        text: `Formate esta programação esportiva no formato correto. Corrija erros de formatação, remova "x ?" e aplique FORMATO B para esportes individuais:\n\n${text}`,
      });
    }

    if (image) {
      userContent.push(
        { type: "text", text: "Extraia a programação esportiva desta imagem:" },
        { type: "image_url", image_url: { url: image } },
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
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
      return new Response(JSON.stringify({ error: "Erro ao processar com IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ text: resultText }), {
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
