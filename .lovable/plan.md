

# Auditoria e Correções do Fluxo de Programação

## Problemas Encontrados

### 1. Dados existentes com `sport_type` errado
Todos os 22 jogos no banco estão com `sport_type: "football"`, incluindo jogos de NBA ("NBA League Pass"), Tênis ("Tênis"), Vôlei ("Vôlei") e Automobilismo ("Automobilismo"). O `detectSportType` só é aplicado na inserção — jogos antigos nunca foram atualizados.

### 2. `detectSportType` não cobre "Automobilismo"
Jogos de Moto2, Moto3, Formula-e e "Automobilismo" caem no fallback `football`. Faltam palavras-chave: `automobilismo`, `moto2`, `moto3`, `motogp`, `formula-e`, `formula e`, `e-prix`, `indycar`, `stock car`.

### 3. Bug no regex de F1
Linha 38 de `gameUtils.ts`: `\b(fórmula 1|...\bgp\b)\b` tem `\b` aninhado dentro do grupo, causando match incorreto.

### 4. Regex de vôlei não detecta "Vôlei" sozinho corretamente
A competição "Vôlei" do banco deveria ser detectada, mas o regex usa `\b` que pode falhar com caracteres acentuados.

## Plano de Correções

### 1. Corrigir `detectSportType` em `src/lib/gameUtils.ts`
- Adicionar detecção de `automobilismo`, `moto2`, `moto3`, `motogp`, `formula-e`, `formula e`, `e-prix`, `indycar`, `stock car` como `f1` (motorsport)
- Corrigir regex do GP: remover `\b` aninhado
- Melhorar regex de vôlei para detectar "Vôlei" isolado

### 2. Migration para corrigir dados existentes
```sql
UPDATE daily_games SET sport_type = 'basketball' WHERE competition ILIKE '%NBA%';
UPDATE daily_games SET sport_type = 'tennis' WHERE competition ILIKE '%Tênis%' OR competition ILIKE '%ATP%' OR competition ILIKE '%WTA%';
UPDATE daily_games SET sport_type = 'volleyball' WHERE competition ILIKE '%Vôlei%' OR competition ILIKE '%volei%';
UPDATE daily_games SET sport_type = 'f1' WHERE competition ILIKE '%Automobilismo%' OR competition ILIKE '%Formula%' OR competition ILIKE '%Moto%';
```

### 3. Atualizar testes em `gameUtils.test.ts`
- Adicionar testes para automobilismo, moto2, formula-e, stock car
- Corrigir/verificar teste existente do GP

### 4. Atualizar prompt da IA (`read-schedule-image`)
- Incluir `🏎️` para automobilismo/motovelocidade (Moto2, Moto3, Formula-e)

### 5. Parser: suporte a eventos sem "x" (sugestão futura)
Eventos como F1, tênis individual e MMA muitas vezes não têm formato "Time A x Time B". Atualmente o parser ignora essas linhas se não tiver ` x `. Isso já funciona via workaround (ex: "Moto3 x Grande Prêmio do Brasil") mas poderia ser melhorado futuramente.

## Arquivos modificados
- `src/lib/gameUtils.ts` — corrigir regex e adicionar motorsport
- `src/lib/gameUtils.test.ts` — novos testes
- `supabase/migrations/` — corrigir sport_type dos dados existentes
- `supabase/functions/read-schedule-image/index.ts` — prompt para automobilismo

