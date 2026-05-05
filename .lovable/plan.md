## Entendi a correção

Você quer manter **todos os eventos** na programação (mesmo os sem canal confirmado), e apenas **corrigir o canal** quando for o caso. O que fizemos antes apagou jogos demais — é preciso reverter o filtro e ajustar a exibição.

## O que mudar

### 1. Edge Function `sync-thesportsdb/index.ts`
Remover o `continue` que descarta eventos sem canal. Voltar a inserir o jogo com `channels: []`. Manter:
- Filtro 3-camadas para canais reais (eventstv.php → só BR confirmado).
- Fallback estrito (Brasileirão, Copa do Brasil, Libertadores, Champions, F1, UFC etc. — competições com cobertura integral).
- Blocklist de ligas estrangeiras só impede o fallback genérico (não bloqueia o evento).

Resultado: evento sempre entra na programação; `channels` fica vazio quando não há transmissão BR confirmada.

### 2. UI — exibição quando não houver canal
Onde hoje mostramos a lista de canais (cards/lista de jogos), adicionar fallback visual:
- Se `channels.length === 0` → exibir badge cinza **"Sem transmissão na TV"** (ou "Canal não confirmado") em vez de espaço vazio.
- Se houver canais → exibir normalmente.

Componentes prováveis a ajustar (a confirmar na implementação): `GameCard`, `LiveGameCard`, `ScheduleList`.

### 3. Re-sincronizar a data atual
Após o ajuste, disparar o sync para repopular os jogos que foram apagados na limpeza anterior (NBA, MLB, NHL, Premier League, etc.). Eles voltarão a aparecer:
- Com canal correto quando a API confirmar.
- Sem canal (badge "Sem transmissão") quando não confirmar.

## Sugestões adicionais

- **Tabela `broadcast_overrides` no banco** (admin edita pares competição → canais), permitindo cadastrar manualmente "NBA Finals → ESPN" sem redeploy. Resolve o caso jogo-a-jogo de NBA/MLB/NFL.
- **Botão "Editar canal" no admin de jogos**: 1 clique para corrigir o canal de um jogo específico já sincronizado.
- **Painel Sync Stats** já mostra `noChannelByCompetition` — usar essa lista pra priorizar overrides.

## Arquivos afetados
- `supabase/functions/sync-thesportsdb/index.ts` — reverter `continue` + reativar contador de "sem canal".
- 1-2 componentes de card de jogo — exibir badge "Sem transmissão" quando vazio.
- Re-executar sync manual após deploy.