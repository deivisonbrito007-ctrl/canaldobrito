

# Auditoria: Timing dos Eventos Ao Vivo

## Problemas Encontrados

### 1. Nenhum jogo aparece ao vivo — todos com `active: false`
Todos os 30+ jogos de hoje (2026-03-21) estão com `active: false` e **sem `publish_at`** definido. Como:
- A query do `useDailyGames` filtra `active = true`
- A função `activate-scheduled` só ativa jogos que têm `publish_at` definido

**Resultado**: nenhum jogo aparece nas seções ao vivo, independente do horário. Este é o principal problema.

### 2. Durações dos esportes são imprecisas
As durações em `SPORT_DURATION` consideram apenas o tempo de jogo regulamentar, sem intervalo, descontos ou paradas:

| Esporte | Atual | Realista (com intervalos) |
|---|---|---|
| Futebol | 90min | 115min (90 + 15 intervalo + 10 acréscimos) |
| Basquete | 48min | 150min (48 de jogo + intervalos + timeouts) |
| Tênis | 180min | 210min (melhor cobrir partidas longas) |
| F1 | 120min | 130min (margem para safety car) |
| MMA | 25min | 35min (5 rounds + intervalos) |
| Vôlei | 90min | 120min (sets longos com tie-break) |

Com as durações atuais, um jogo de basquete que começa às 14h some do ao vivo às 14:48 — quando na realidade ainda está no 2º quarto.

## Plano de Correção

### Arquivo: `src/lib/gameUtils.ts`
1. **Atualizar `SPORT_DURATION`** com valores realistas que incluem intervalos e margens
2. Adicionar um **buffer de 15min** após a duração oficial para cobrir atrasos e acréscimos, via constante `LIVE_BUFFER_MINUTES`
3. Aplicar o buffer nas funções `isGameCurrentlyLive` e `getElapsedMinutes`

### Dados no banco
Os jogos precisam ter `active: true` para aparecer. Duas opções:
- **Opção A**: Definir `publish_at` nos jogos para que o cron os ative automaticamente
- **Opção B**: O admin precisa marcar os jogos como ativos manualmente

O código do admin que insere jogos já define algum valor? Preciso verificar, mas o problema atual é que os dados estão inativos.

### Verificação no admin de inserção de jogos
Verificar se o `DailyGamesManager` define `active: true` ou `publish_at` ao inserir jogos — se não, corrigir para que jogos sejam ativos por padrão ou tenham `publish_at` configurado.

## Resultado esperado
- Jogos aparecem ao vivo no horário correto
- Permanecem ao vivo pela duração realista do esporte + buffer
- Sem desaparecimentos prematuros

