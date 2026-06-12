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
- ❌ NÃO emita cabeçalhos de seção (ex: "🏀 BASQUETE", "🥊 MMA") quando aquela seção não tem jogos identificados. Simplesmente OMITA a seção.
- ❌ NUNCA escreva linhas como "Nenhum jogo identificado na imagem.", "Nenhum evento identificado", "Sem jogos hoje" ou variações. Se não há jogos para um esporte, OMITA a seção inteira (cabeçalho + texto).
- ❌ NÃO repita o mesmo jogo duas vezes. Cada partida deve aparecer UMA única vez.

Regras gerais:
- Use "x" minúsculo para separar times APENAS no formato A
- Horário SEMPRE no formato HHhMM (ex: 19h00, 16h30) — NUNCA use "HH:MM" (ex: nunca "19:00")
- Se houver múltiplas datas, crie um bloco 📅 para cada
- Se o jogo for feminino, adicione (F) após o time visitante
- Liste TODOS os canais separados por vírgula
- Os campos 🏆/⏰ devem ficar na MESMA linha separados por " / "; 📺 na linha seguinte
- NÃO adicione texto extra, apenas o formato acima
- Se não conseguir ler algum dado, use "?" como placeholder APENAS para times, horários ou canais — NUNCA como adversário em esportes individuais

Identificação de esportes:
- Para basquete (NBA, NBB, EuroLeague, WNBA, ACB, Liga Endesa), use 🏀 antes da competição → FORMATO A
- Para tênis (ATP, WTA, Roland Garros, Wimbledon, US Open, Australian Open, Masters, Grand Slam), use 🎾 antes da competição → FORMATO B
- Para Fórmula 1, automobilismo e motovelocidade (F1, GP, Grande Prêmio, MotoGP, Moto2, Moto3, Formula E, E-Prix, IndyCar, Stock Car, Automobilismo), use 🏎️ antes da competição → FORMATO B
- Para MMA e luta (UFC, Bellator, PFL, Boxing, Boxe), use 🥊 antes da competição → FORMATO B
- Para vôlei (Superliga, Liga das Nações, Champions), use 🏐 antes da competição → FORMATO A
- Para baseball (MLB, NPB), use ⚾ antes da competição → FORMATO A
- Para rugby (Super Rugby, Six Nations), use 🏉 antes da competição → FORMATO A
- Para futebol, use 🏆 normalmente (padrão) → FORMATO A`;

const DEFAULT_MODEL = "google/gemini-2.5-flash";
const MAX_PAYLOAD_BYTES = 8 * 1024 * 1024; // 8MB base64
const TIMEOUT_MS = 45_000;

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();
  let stage = "parse_body";

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json(400, { error: "Body inválido. Envie JSON com 'image' (base64) ou 'text'." });
    }

    const { image, text, model } = body as { image?: string; text?: string; model?: string };

    if (!image && !text) {
      return json(400, { error: "Campo 'image' (base64) ou 'text' é obrigatório" });
    }

    // Size guard (base64 length is a good proxy for payload bytes)
    const payloadBytes = (image?.length ?? 0) + (text?.length ?? 0);
    if (payloadBytes > MAX_PAYLOAD_BYTES) {
      return json(413, {
        error: `Imagem muito grande para a IA (${(payloadBytes / 1024 / 1024).toFixed(1)}MB). Reduza para no máximo 8MB.`,
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error(JSON.stringify({ stage: "config", error: "LOVABLE_API_KEY missing" }));
      return json(500, { error: "Serviço de IA não configurado. Contate o administrador." });
    }

    stage = "build_request";
    const userContent: Array<Record<string, unknown>> = [];
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

    stage = "ai_gateway";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model || DEFAULT_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
        }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      const isAbort = err instanceof Error && err.name === "AbortError";
      console.error(JSON.stringify({ stage, ms: Date.now() - startedAt, error: String(err), abort: isAbort }));
      return json(isAbort ? 504 : 502, {
        error: isAbort
          ? "Tempo esgotado lendo a imagem (>45s). Tente uma imagem menor ou mais nítida."
          : "Falha de rede ao contatar o serviço de IA.",
      });
    }
    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.error(JSON.stringify({ stage, status: response.status, ms: Date.now() - startedAt, body: errBody.slice(0, 500) }));

      if (response.status === 429) {
        return json(429, { error: "Muitas requisições à IA. Aguarde alguns segundos e tente novamente." });
      }
      if (response.status === 402) {
        return json(402, { error: "Créditos de IA esgotados. Adicione créditos em Settings → Workspace → Usage." });
      }
      return json(502, { error: `Erro do serviço de IA (${response.status}). Tente novamente.` });
    }

    stage = "parse_response";
    const data = await response.json();
    const resultText = (data?.choices?.[0]?.message?.content ?? "").toString().trim();

    if (!resultText) {
      console.warn(JSON.stringify({ stage, ms: Date.now() - startedAt, msg: "empty content" }));
      return json(200, { text: "", warning: "A IA não retornou texto. Tente outra imagem." });
    }

    console.log(JSON.stringify({
      stage: "ok",
      ms: Date.now() - startedAt,
      bytes: payloadBytes,
      model: model || DEFAULT_MODEL,
      chars: resultText.length,
    }));

    return json(200, { text: resultText });
  } catch (e) {
    console.error(JSON.stringify({ stage, ms: Date.now() - startedAt, error: e instanceof Error ? e.message : String(e) }));
    return json(500, { error: e instanceof Error ? e.message : "Erro desconhecido" });
  }
});
