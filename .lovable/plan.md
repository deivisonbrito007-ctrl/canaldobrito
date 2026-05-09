## Diagnóstico do erro

O toast "Edge Function returned a non-2xx status code" apareceu na aba **Admin → Banners → Programação**, ao usar o botão de **ler imagem** (que chama a edge function `read-schedule-image`).

A função usa o **Lovable AI Gateway** (`google/gemini-2.5-pro`). Os logs recentes só mostram boots (não há registro da chamada que falhou nesse instante), o que aponta para um destes três cenários:

1. **402 — Créditos do AI Gateway esgotados** (mensagem específica já existe no código).
2. **429 — Rate limit** do Gemini Pro (modelo mais lento/caro, fácil de estourar).
3. **500 — Resposta inesperada do gateway** (timeout em imagens grandes / base64 enorme).

O cliente faz `if (error) throw error;` mas o `error` do `supabase.functions.invoke` é genérico e **descarta o JSON do body** (que contém a mensagem amigável já preparada na função). Por isso o usuário vê só o texto cru do supabase-js.

## O que fazer

### 1. Corrigir o tratamento do erro no client (`ProgramacaoTexto.tsx`)
- Quando `invoke` retornar `error`, ler `data?.error` antes de lançar — o body com `{ error: "Créditos esgotados…" }` continua acessível.
- Mostrar toast com a mensagem real (créditos, rate limit, imagem inválida) em vez do texto genérico.
- Logar `status` + `body` no console para debug.

### 2. Endurecer a edge function `read-schedule-image`
- Trocar o modelo padrão para `google/gemini-2.5-flash` (mais rápido, mais barato, suficiente para OCR de programação) e manter `pro` como fallback opt-in.
- Adicionar `AbortController` com timeout de 45s para evitar 504 silencioso.
- Validar tamanho do base64 (>8MB → 413) antes de chamar o gateway.
- Sempre devolver `corsHeaders` (já ok) e nunca `throw` sem JSON.
- Log estruturado: `{ stage, status, ms, bytes }` para facilitar auditoria futura.

### 3. Melhorias de UX na aba Programação (Banners)
- **Indicador de progresso**: trocar o spinner mudo por estados ("Enviando imagem…" → "Lendo com IA…" → "Formatando…").
- **Pré-validação local**: se a imagem for >5MB, comprimir client-side com `canvas` antes de enviar (reduz 402/timeout).
- **Botão "Tentar novamente"** no toast de erro recuperável (429/timeout).
- **Dica visível** quando o erro for 402: link para a aba de configurações com instrução clara.
- **Acessibilidade mobile**: garantir `min-h-11` no botão de upload e `aria-busy` enquanto processa.

### 4. Verificação
- Rodar `bunx vitest run` para garantir 100% verde.
- Testar manualmente: imagem válida pequena, imagem >5MB, texto colado sem imagem, rede offline (deve mostrar erro amigável).
- Conferir logs da função após o teste para validar o log estruturado.

## Arquivos afetados
- `src/components/admin/ProgramacaoTexto.tsx` — tratamento de erro + UX de upload.
- `supabase/functions/read-schedule-image/index.ts` — modelo padrão, timeout, validação, logs.
- (possivelmente) `src/pages/admin/AdminBanners.tsx` — só se precisar de hook compartilhado.

## Sugestões extras (opcional, posso incluir se aprovar)
- Cache de 60s no client para a mesma imagem (hash do base64) — evita reprocessar quando o admin troca de aba.
- Botão "Limpar texto extraído" ao lado do textarea.
- Mostrar contagem de jogos detectados em tempo real conforme o texto é colado/editado.
