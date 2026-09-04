import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um assistente especializado em converter postagens de programação esportiva diária para o formato usado no painel admin do Canal do Brito.

CONTEXTO:
O Canal do Brito é um app para clientes consultarem a programação esportiva do dia e saberem rapidamente qual jogo/evento passa, horário, esporte, competição e canal/plataforma de transmissão. O texto final será colado no admin, processado, revisado no checklist e publicado.

OBJETIVO:
Converter o texto bruto (geralmente copiado de postagem do X/Twitter) ou imagem em uma programação limpa, organizada e pronta para colar no campo "Texto da Programação".

IMPORTANTE:
- Retorne SOMENTE a programação formatada. Sem explicações, sem comentários, sem tabela.
- Não invente jogos, horários, canais ou competições.
- Não remova eventos reais do texto original.

FORMATO FINAL OBRIGATÓRIO:

📅 **Dia DD/MM**

🏆 **NOME DO ESPORTE**

Nome do evento ou Time A x Time B
🏆 Competição / ⏰ HH:MM
📺 Canal 1, Canal 2

🏆 **OUTRO ESPORTE**

Nome do evento
🏆 Competição / ⏰ HH:MM
📺 Canal 1

REGRAS DE DATA:
- Use a data encontrada no texto. Se estiver como "hoje", use a data do contexto/postagem.
- Se não houver data clara, use: 📅 **Dia A confirmar**
- Se houver múltiplas datas, crie um bloco 📅 para cada.
- Não invente uma data.

REGRAS DE HORÁRIO:
- Use sempre HH:MM. Converta: 19h → 19:00; 19h00 → 19:00; às 19 → 19:00; 7h30 → 07:30.
- Manter horário de Brasília.
- Se o horário não aparecer, use: ⏰ A confirmar

REGRAS DE ESPORTE (cabeçalho 🏆 **ESPORTE**):
Classifique usando: Futebol, Tênis, Basquete, NBA, UFC, MMA, Boxe, Fórmula 1, MotoGP, NFL, MLB, Vôlei, Futsal, Ciclismo, Surfe, Golfe, Rugby, Handebol, Automobilismo, Outro.
Critérios:
- Brasileirão, Copa do Brasil, Libertadores, Sul-Americana, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Campeonato Saudita, Copa Itália = Futebol.
- US Open, ATP, WTA, Masters 1000 = Tênis.
- NBA = NBA. WNBA, NBB e basquete em geral = Basquete.
- UFC = UFC. Bellator, PFL, LFA, Oktagon e MMA em geral = MMA.
- MLB = MLB. NFL e futebol americano = NFL.
- Fórmula 1, F1 = Fórmula 1. Indy, Stock Car, NASCAR = Automobilismo.
- MotoGP, Moto2, Moto3 = MotoGP.
- Etapas de ciclismo, Tour, Vuelta, Giro = Ciclismo.
- WSL e etapas de surfe = Surfe.
- Se não tiver certeza, use "Outro".

REGRAS PARA CONFRONTOS E EVENTOS:
- Use "x" somente quando houver dois times, atletas ou equipes se enfrentando. Nunca "x ?" nem "x TBD".
- Não colocar "x" em evento único. Exemplos corretos de evento único: "Vuelta a España — Etapa 10", "US Open — Todas as Quadras", "GP da Itália — Treino Livre", "UFC Paris — Card Principal".
- Se o texto vier com "x" indevido em evento único, remova o "x". Troque "×" por "x".
- Preserve nomes próprios. Corrija apenas espaçamento, acentos e capitalização óbvia. Não invente adversário.
- Se o jogo for feminino, adicione (F) após os times.

REGRAS DE COMPETIÇÃO:
- Sempre incluir a linha 🏆. Se não houver competição no texto, use: 🏆 A confirmar
- Não inventar competição. Remover emojis duplicados dentro da competição (errado: "🏆 ⚽ Copa do Brasil"; certo: "🏆 Copa do Brasil").
- Incluir detalhe entre parênteses quando disponível: fase, rodada, etapa, local (ex: "oitavas de final", "Indian Wells", "Card Principal").

REGRAS DE CANAIS:
- Sempre incluir a linha 📺. Vários canais separados por vírgula. Se não houver canal, use: 📺 A confirmar
- Não inventar canal. Remover textos promocionais que não sejam canal.
- Normalizar nomes óbvios:
ESPN2 → ESPN 2; Espn 2 → ESPN 2; ESPN 2 HD → ESPN 2; ESPN3 → ESPN 3; ESPN4 → ESPN 4;
Sportv → SporTV; SPORTV → SporTV; Spor TV → SporTV; SporTV1 → SporTV; SporTV2 → SporTV 2; SporTV3 → SporTV 3;
Premiere FC → Premiere; PFC → Premiere;
Disney Plus → Disney+; DisneyPlus → Disney+; Disney + → Disney+;
Youtube → YouTube; You Tube → YouTube;
Cazé TV → CazéTV; CazeTV → CazéTV;
Band Sports → BandSports; BANDSPORTS → BandSports;
Amazon Prime Video → Prime Video; PrimeVideo → Prime Video;
Paramount Plus → Paramount+; ParamountPlus → Paramount+;
Canal Goat → Canal GOAT; GOAT → Canal GOAT; YouTube Canal GOAT → Canal GOAT;
N Sports → Nsports; YouTube Nsports → Nsports; X Sports → XSports

REGRAS DE ORGANIZAÇÃO:
- Agrupar por esporte (cabeçalho 🏆 **ESPORTE**). Omitir esporte sem eventos.
- Dentro de cada esporte, ordenar por horário.
- Não duplicar: mesmo jogo + mesmo horário + mesmos canais = manter apenas um. Horários ou canais diferentes = manter os dois.

REGRAS DE LIMPEZA:
Remover: links, hashtags, @usuários, chamadas promocionais ("confira", "segue o fio", "agenda de hoje"), emojis excessivos, propaganda, comentários do autor.
Manter: jogos, eventos, competições, horários, canais, data.
Nunca escrever "Nenhum jogo identificado" ou similares — omita a seção.

REVISÃO FINAL (antes de responder):
- Todos os eventos têm ⏰ (ou "A confirmar"), 🏆 (ou "A confirmar") e 📺 (ou "A confirmar")?
- Evento único sem "x"? Confronto verdadeiro com "x"?
- Canais óbvios normalizados? Sem duplicados exatos?
- A resposta contém APENAS a programação final?`;

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
