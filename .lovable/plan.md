## Diagnóstico

Analisando o código atual (`detectSportType` em `src/lib/gameUtils.ts` + lógica de prioridade em `parseScheduleText`), o jogo `Figueirense x Paysandu / Brasileirão Série C` **deveria** ser classificado como `football`:

- Está sob a seção `⚽ FUTEBOL` (define `currentSectionSport='football'`).
- `detectSportType("Brasileirão Série C", "Figueirense Paysandu")` não casa com nenhum regex (basketball/baseball/tennis/etc.) → cai no fallback `football`.
- Prioridade final: `meta.sport_type (null) → autoSport ('football') → currentSectionSport ('football')`.

Se mesmo assim o preview está mostrando "basquete", os suspeitos são:
1. **Preview com cache antigo** — o `parsed[]` no estado React foi gerado antes do meu fix. Basta clicar em "Processar texto" novamente. Mas isso é frágil — precisamos de proteção mais robusta.
2. **Algum caminho secundário** ainda usando lógica antiga (`generateWhatsAppSummary`, fallback no display sem `currentSectionSport`).
3. **Regex com falso-positivo invisível** — variantes Unicode no texto colado (NBSP, ZWJ) podem estar quebrando boundaries.

## Mudanças

### 1. Teste de integração com o texto real do usuário
Em `src/components/admin/__tests__/ProgramacaoTexto.test.tsx`, adicionar um `describe("agenda real 31/05")` que cola o bloco completo enviado e valida que TODOS os 36 jogos saem com o `sport_type` esperado, mapeando esperado por linha:
- Todos sob `⚽ FUTEBOL` → `football` (inclui Figueirense x Paysandu).
- `🏀 BASQUETE` → `basketball`.
- `⚽ FUTSAL` → `football` (não há tipo futsal).
- `⚾ BASEBALL` → `baseball`.
- `🎾 TÊNIS` → `tennis`.
- `🏐 VÔLEI DE PRAIA` → `volleyball`.
- `🏎️ AUTOMOBILISMO` → `f1`.

Esse teste é o "ground truth" — se passar, o bug está no preview/cache; se falhar, o assert vai apontar exatamente qual jogo o parser está errando.

### 2. Endurecer o parser contra Unicode invisível
Em `parseScheduleText` (`src/components/admin/ProgramacaoTexto.tsx`), normalizar cada linha antes da detecção:
```text
.normalize("NFKC").replace(/[\u00A0\u200B-\u200D\uFEFF]/g, " ")
```
Isso evita que NBSP/zero-width chars vindos do WhatsApp impeçam o match das regex de seção/competição.

### 3. Reforçar a precedência da seção sobre o autodetect
Hoje a prioridade é: `emoji do jogo > autoSport ≠ football > section > football`. Trocar para:
```text
emoji do jogo (não-genérico) > section header > autoSport (≠ football) > football
```
Justificativa: quando o usuário declara explicitamente `⚽ FUTEBOL`, isso vence qualquer falso-positivo de regex (ex.: se algum dia `detectSportType` casar "Paysandu" com algum termo, a seção continua mandando).

### 4. Forçar reprocessamento ao colar texto novo
Sempre que `text` mudar via `onChange`, esvaziar `parsed[]`. Assim a UI nunca exibe um resultado stale relativo ao texto atual. Hoje `parsed` só é atualizado quando o admin clica "Processar texto" — se ele editar e olhar, vê resultado antigo.

### 5. Badge de origem do `sport_type` (opcional, peço confirmação)
No card de preview, um pequeno chip mostrando como o sport_type foi decidido: `seção`, `emoji`, `regex`, `fallback`. Isso facilita diagnóstico futuro sem precisar abrir console.

## Detalhes técnicos

- Em `ProgramacaoTexto.tsx`, trocar:
  ```text
  const finalSport = (meta.sport_type && meta.sport_type !== 'football')
    ? meta.sport_type
    : (autoSport !== 'football') ? autoSport
    : currentSectionSport || 'football';
  ```
  por:
  ```text
  const finalSport = (meta.sport_type && meta.sport_type !== 'football')
    ? meta.sport_type
    : currentSectionSport
    ?? (autoSport !== 'football' ? autoSport : 'football');
  ```

- Mesmo ajuste na função `generateWhatsAppSummary` e no caminho de publicação (`finalSportType` ~ linha 935) para que a seção também vença ali.

- Normalização Unicode aplicada uma única vez ao topo de `parseScheduleText`, antes de `split("\n")`.

## Riscos

- Mudar a precedência para seção > autoSport pode subordinar algum caso onde a seção esteja mal rotulada e o regex acerte. Mitigação: o autoSport ainda entra quando a seção não está definida, e o admin tem o `<select>` para corrigir manualmente.
- Limpar `parsed[]` ao editar texto força reclique em "Processar" — comportamento mais previsível e evita resultado fantasma.