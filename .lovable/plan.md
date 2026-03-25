

# Auditoria da Aba WhatsApp no Admin

## Bugs Encontrados

### 1. Data calculada no escopo do modulo — fica stale (BUG)
As variaveis `today`, `todayStr`, `formattedDate` e `dayName` (linhas 11-14) sao calculadas **uma unica vez** quando o modulo e importado. Se o admin deixar a aba aberta e o dia mudar (meia-noite), os templates mostram a data do dia anterior. Os jogos tambem buscam a data errada.

**Correcao**: Mover o calculo de data para dentro do componente `AdminWhatsApp`, usando `useMemo`.

### 2. `WhatsAppFab.tsx` e `WhatsAppShareButton.tsx` sao codigo morto (CLEANUP)
Nenhum dos dois e importado em nenhum lugar do projeto. Ocupam espaco sem funcao.

**Correcao**: Remover ambos os arquivos.

### 3. Jogos do Dia nao mostra canais (UX)
O texto gerado para jogos mostra `horario — time x time (competicao)` mas ignora `g.channels`. O admin perde informacao util ao compartilhar.

**Correcao**: Incluir canais no texto, ex: `⏰ 16:00 — Flamengo x Palmeiras (Brasileirão) — ESPN, Premiere`.

### 4. Jogos do Dia nao mostra esporte (UX)
O campo `sport_type` existe mas nao e usado. Se houver jogos de basquete e futebol misturados, fica confuso.

**Correcao**: Agrupar jogos por `sport_type` no texto gerado, ou adicionar emoji por esporte.

### 5. Sem contagem de caracteres na mensagem personalizada (UX)
WhatsApp tem limite informal de preview (~1024 chars). O admin nao sabe se a mensagem ficou longa demais.

**Correcao**: Adicionar contador de caracteres discreto abaixo do textarea.

### 6. Sem testes unitarios
Nenhum teste existe para AdminWhatsApp.

**Correcao**: Criar testes basicos verificando render dos templates, contagem de jogos, e estado vazio.

## Arquivos modificados
- `src/pages/admin/AdminWhatsApp.tsx` — data dinamica com useMemo, canais nos jogos, agrupamento por esporte, contador de caracteres
- `src/components/public/WhatsAppFab.tsx` — remover (codigo morto)
- `src/components/public/WhatsAppShareButton.tsx` — remover (codigo morto)
- `src/pages/admin/__tests__/AdminWhatsApp.test.tsx` — criar testes basicos

