## Problema

No texto enviado pelo usuário, cada esporte aparece com um cabeçalho como:
- `⚽ FUTEBOL`, `🏀 BASQUETE`, `⚽ FUTSAL`, `⚾ BASEBALL`, `🎾 TÊNIS`, `🏐 VÔLEI DE PRAIA`, `🏎️ AUTOMOBILISMO`

O parser (`src/components/admin/ProgramacaoTexto.tsx`) considera qualquer linha que comece com 🏀, 🎾, 🏎️, 🏐, ⚾, 🥊, 🏒, 🏉 como "linha de metadado" (`isMetadataLine`) e por isso `isSectionHeader` retorna `false`. O `currentSectionSport` nunca é setado, e a classificação cai inteiramente em `detectSportType` (que olha só a competição do jogo).

Como cada jogo vem com `🏆 <Competição>` (emoji genérico), o sport_type por emoji também não ajuda, e várias competições não estão no regex de `detectSportType`. Consequências observadas no texto enviado:

- `🏐 VÔLEI DE PRAIA` → "Beach Pro Tour / Elite16 Ostrava" → vira **futebol**.
- `🏎️ AUTOMOBILISMO` → "Mundial de Motocross / MXGP", "NASCAR Cup/Brasil", "Copa Truck", "Indy NXT" → viram **futebol**.
- `⚽ FUTSAL` → "Liga Nacional de Futsal (LNF)" → vira futebol (não temos tipo futsal, mas pelo menos é coerente).
- Demais seções funcionam só por coincidência (NBB, MLB, Roland Garros, MotoGP já estão nos regex).

## Mudanças

### 1. `src/components/admin/ProgramacaoTexto.tsx`

a) Novo helper `detectSectionHeaderSport(line)` que reconhece o padrão `^<emoji_esporte>\s+<TEXTO MAIÚSCULO curto>$` (até ~30 chars, sem dígitos, sem " x ", sem `/`) e devolve o `SportType` correspondente ao emoji. Cobre: ⚽, 🏀, 🎾, 🏎️/🏎, 🏐, ⚾, 🏒, 🏉, 🥊, 🏄, 🚴, ⛳, 🏊.

b) Em `parseScheduleText`, antes do bloco `isSectionHeader`, checar `detectSectionHeaderSport`. Se casar:
- Setar `currentSectionSport` com o esporte do emoji (sobrepondo o fallback "futebol" do `detectSportType`).
- Consumir a linha (`i++; continue`) — assim ela não é tratada como metadado nem como título de jogo.

c) Ajustar a prioridade do `finalSport` para deixar o `currentSectionSport` ganhar quando vier do cabeçalho com emoji explícito (hoje ele só entra se `detectSportType` retornar `'football'`). Manter a lógica atual: emoji do jogo > detectSportType (≠ football) > section header > football. Isso já está correto; basta o section header ser preenchido.

### 2. `src/lib/gameUtils.ts` — ampliar `detectSportType`

Adicionar tokens que aparecem no texto e que hoje caem no fallback:
- `f1`/automobilismo: `motocross`, `mxgp`, `nascar`, `copa truck`, `indy nxt`, `truck series`.
- `volleyball`: `beach pro tour`, `v[oô]lei de praia`, `elite16`.
- `tennis`: já cobre Roland Garros (ok).
- Comentário no fim sobre futsal continuar mapeado como `football` (não há tipo dedicado).

### 3. Testes — `src/components/admin/__tests__/ProgramacaoTexto.test.tsx`

Adicionar casos cobrindo o texto real enviado:
- `🏐 VÔLEI DE PRAIA` + "Elite16 Ostrava / Beach Pro Tour" → `sport_type === 'volleyball'`.
- `🏎️ AUTOMOBILISMO` + "MXGP / Mundial de Motocross" → `f1`.
- `🏎️ AUTOMOBILISMO` + "Cracker Barrel 400 / NASCAR Cup Series" → `f1`.
- `⚾ BASEBALL` + "Cardinals x Cubs / MLB" → `baseball` (já passa, regressão).
- `🎾 TÊNIS` + "Roland Garros / Aberto da França" → `tennis`.
- `🏀 BASQUETE` + "SESI Franca x Pinheiros / NBB" → `basketball`.

### 4. Sugestões adicionais (não obrigatórias, peço confirmação)

- Mostrar no preview da Programação um chip com o `sport_type` detectado em cada jogo e um aviso quando ele vier só do fallback "futebol", para o admin revisar antes de salvar.
- Botão "Reclassificar" por jogo, alternando manualmente o esporte sem precisar reeditar o texto.

## Detalhes técnicos

Estrutura nova em `ProgramacaoTexto.tsx`:

```text
const SECTION_HEADER_SPORT_RE =
  /^(⚽|🏀|🎾|🏎️|🏎|🥊|🏐|🏒|⚾|🏉|🏄|🚴|⛳|🏊)\s+([A-ZÀ-Ý ÇÃÕÉÊÁÍÚ]{3,30})$/;

function detectSectionHeaderSport(line: string): SportType | null { ... }
```

No loop principal, antes de `isSectionHeader`:

```text
const sectionSport = detectSectionHeaderSport(line);
if (sectionSport) { currentSectionSport = sectionSport; i++; continue; }
```

## Riscos

- Falso positivo: uma linha com `🏆 BRASILEIRÃO SÉRIE A` poderia parecer cabeçalho. Mitigação: regex só aceita os emojis de esporte (sem 🏆) e exige texto totalmente maiúsculo sem dígitos.
- Testes existentes (multi-line e Format A) continuam passando — a checagem nova roda antes de `isMetadataLine` apenas para o padrão restrito.