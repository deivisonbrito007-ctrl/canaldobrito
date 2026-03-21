

# Auditoria: Abas Ao Vivo + Programação + Rodagem Novidades

## Problemas encontrados

### 1. Erro de Console: `Function components cannot be given refs`
Dois componentes causam este warning:
- **`MetadataRow`** — passado como filho do `AnimatePresence`/`motion.div`, que tenta atribuir ref
- **`ContentDetailSheet`** — mesmo problema

Correção: nenhum deles precisa de `forwardRef` neste caso, mas o `ContentDetailSheet` é renderizado diretamente como filho de `<section>` sem wrapper de `AnimatePresence` externo — o problema está no React tentando validar refs. A solução é garantir que nenhum componente funcional esteja sendo passado onde um ref é esperado.

### 2. Rodagem do NovidadesCard (Carousel)
A rotação automática funciona (timer de 5s), mas tem um problema: **quando o sheet de detalhe fecha, o timer reinicia mas não reseta o `didSwipe` ref**, o que pode causar cliques ignorados após um swipe. Além disso, o carousel para quando o usuário abre o detalhe — correto.

### 3. LiveFeedSection e LiveEventsSection — Data de hoje
Ambas usam `getLocalDateString()` que retorna a data local. Porém, os dados no banco mostram `date: "2026-03-20"` enquanto hoje é `2026-03-21`. Isso significa que **as seções ao vivo estão buscando jogos de ontem** porque o `today` state é inicializado uma vez e atualizado a cada 60s — mas se a página ficou aberta desde ontem, o state pode estar desatualizado. O `setToday(getLocalDateString())` no interval resolve isso, mas o intervalo de 60s pode causar um delay.

### 4. Programação (ScheduleTab) — mesma questão de data
O `DailyGamesSection` também usa `getLocalDateString()` para buscar jogos do dia. Está correto, mas não oferece navegação entre dias — se não houver jogos hoje, mostra "Nenhum jogo programado".

## Plano de correções

### Arquivo: `src/components/public/NovidadesCard.tsx`
1. Corrigir warning de ref no `MetadataRow` — não é passado para `AnimatePresence` diretamente, mas o `motion.div` wrapper pode estar causando. Verificar e adicionar `forwardRef` se necessário
2. Resetar `didSwipe.current = false` no `handleSheetClose`

### Arquivo: `src/components/public/ContentDetailSheet.tsx`
3. Envolver com `React.forwardRef` para eliminar o warning de ref

### Sugestões de melhoria (opcionais)
- **LiveFeedSection / LiveEventsSection**: a lógica está correta, sem bugs funcionais. A rotação de dados depende de ter jogos ao vivo no momento — quando não há, as seções se ocultam automaticamente (comportamento correto)
- **DailyGamesSection**: funcional e bem implementada. Os filtros, agrupamento por período e NextGameHero funcionam corretamente
- A **rodagem do NovidadesCard** (5s auto-advance) funciona. Swipe e setas funcionam. Apenas o bug menor do `didSwipe`

## Resumo das mudanças
| Arquivo | Mudança |
|---|---|
| `NovidadesCard.tsx` | Reset `didSwipe` no close do sheet |
| `ContentDetailSheet.tsx` | Adicionar `forwardRef` para eliminar warning |

