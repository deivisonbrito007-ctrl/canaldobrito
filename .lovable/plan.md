## Diagnóstico

Testei o `tsdb-match-game` para um jogo real (`Botafogo x Racing` hoje). Resposta:

```json
{ "matched": false, "candidates": [] }
```

Significa: **a TheSportsDB devolveu zero candidatos** no `eventsday.php?d=2026-05-06&s=Soccer`. Confirmando direto na API com a chave de teste `3`, retornou só **3 jogos no mundo todo** — basicamente vazio. Com a chave premium o resultado deveria ser muito maior, mas pelo comportamento (resposta vazia) é provável que a chamada não esteja efetivamente usando a chave premium ou esteja batendo em endpoint errado.

Outro ponto: vários jogos do dia são de competições sul-americanas/Brasileirão B/Sudamericana que nem sempre aparecem no `eventsday`; precisam ser buscados também por liga.

## Mudanças propostas

### 1) `tsdb-match-game` — buscar de mais fontes e logar
- Tentar `eventsday.php?d=DATE&s=Soccer` **e** `eventsday.php?d=DATE` (sem filtro), deduplicando.
- Adicionar `console.log` mostrando: total de eventos retornados pela TSDB, top 3 candidatos com score. Assim conseguimos ver no Logs se o problema é "API vazia" ou "match ruim".
- Normalização melhor: remover sufixos comuns (`fc`, `cf`, `sc`, `ec`, `clube`, `de`, `do`, etc.) antes de comparar.
- Reduzir threshold de aceite de **0.85 → 0.80** e de candidato de **0.45 → 0.40**.

### 2) `tsdb-live-update` — fallback por busca quando vínculo falhou
- Se um jogo está na janela ao vivo e ainda não tem `external_id`, tentar **auto-match em runtime** (chamada direta ao `eventsday`) e gravar se score ≥ 0.8.
- Assim, mesmo sem você clicar em "Vincular dia", o cron de 1 min já tenta vincular sozinho e puxa o placar.

### 3) Suporte ao endpoint **v2 livescore** (se a chave premium for v2)
- Adicionar fallback para `https://www.thesportsdb.com/api/v2/json/livescore/all` (header `X-API-KEY`) — esse endpoint retorna **só os jogos ao vivo agora**, com placar e minuto. Isso é exatamente o que precisamos.
- O `tsdb-live-update` passa a ler livescore primeiro, casa por times+data, e cai no `lookupevent` só se já houver `external_id` salvo.

### 4) Verificar se a chave premium está sendo aceita
- Adicionar uma function de diagnóstico simples (ou só um log no `tsdb-match-game`) imprimindo os primeiros 4 chars da chave + `eventsday` retornado, para confirmar se a chave está em vigor.

## Sugestão extra

- Caso a chave premium esteja correta mas a TheSportsDB simplesmente **não cobre** Sul-Americana/Sudamericana/Brasileirão B com profundidade, manter um **fallback opcional via API-Football** (`API_FOOTBALL_KEY` já existe nos secrets) só para o placar, sem cadastrar nada.

Posso aplicar essas 4 mudanças?