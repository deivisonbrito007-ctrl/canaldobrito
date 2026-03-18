

# Simplificar Jogos Ao Vivo com dados reais da API-Football

## Problema
O calculo local de fases (INT, PROR, PEN) e impreciso porque e baseado no horario de inicio e nao no status real do jogo. A API-Football ja fornece `fixture.status.short` (1H, HT, 2H, ET, P, FT) e `fixture.status.elapsed` (minuto real).

## Solucao
Armazenar esses dados da API no banco e usar diretamente no frontend.

---

## Mudancas

### 1. Migracao de banco — adicionar colunas
- `status_short` (text, default 'NS') — status do jogo da API (1H, HT, 2H, ET, P, FT, NS, etc.)
- `elapsed_minutes` (integer, nullable) — minuto real do jogo

### 2. Edge function `sync-daily-games/index.ts`
- Extrair `f.fixture.status.short` e `f.fixture.status.elapsed` da API
- Salvar nos novos campos `status_short` e `elapsed_minutes`

### 3. Frontend `LiveNowSection.tsx`
- Remover funcao `getLiveLabel` com calculo manual de fases
- Usar `status_short` e `elapsed_minutes` diretamente:
  - `1H` / `2H` → mostrar `{elapsed}'`
  - `HT` → "INT"
  - `ET` → `{elapsed}' PRO`
  - `P` → "PEN"
  - Qualquer outro → esconder (jogo nao ao vivo)
- Filtro `isGameLive`: usar `status_short` in `[1H, HT, 2H, ET, P]` em vez de calculo de tempo
- Manter fallback de tempo local apenas quando `status_short` = 'NS' (nao sincronizado)

### 4. Hook `useDailyGames.ts`
- Adicionar `status_short` e `elapsed_minutes` ao tipo `DailyGame`

## Resultado
- Dados precisos da API em vez de estimativas
- Sem labels errados de PROR/PEN
- Indicador simples: minuto real + "AO VIVO"

