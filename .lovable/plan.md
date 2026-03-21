
# Auditoria: Eventos nas Abas Corretas

## Estado Atual

| Componente | Onde aparece | Filtro |
|---|---|---|
| **LiveFeedSection** | Home | Esportes adversariais ao vivo (`!isNonAdversarial`) |
| **LiveEventsSection** | Home | Esportes não-adversariais ao vivo (`isNonAdversarial`) |
| **DailyGamesSection** | Aba Programação | Todos os jogos do dia (sem filtro de tipo) |
| **HighlightsTab** | Aba Destaques | Filmes e séries (sem jogos) |

## Problema Encontrado

**Tênis está classificado como "não-adversarial"** em `gameUtils.ts` (linha 34):
```
const NON_ADVERSARIAL: SportType[] = ['f1', 'tennis'];
```

Tênis é um esporte com confronto direto (jogador vs jogador), então deveria aparecer no **LiveFeedSection** (partidas com "VS") e não no **LiveEventsSection** (eventos sem confronto). Atualmente, partidas de tênis aparecem na seção errada com layout de "evento único" em vez de "Time A VS Time B".

## Demais Verificações — OK

- **LiveFeedSection** e **LiveEventsSection** usam `getLocalDateString()` corretamente e se ocultam quando não há eventos
- **DailyGamesSection** mostra todos os jogos do dia agrupados por período — funciona corretamente
- **HighlightsTab** mostra apenas filmes/séries — sem conflito com jogos
- O timer de 60s atualiza a data e o status ao vivo — correto
- F1 e MMA estão classificados corretamente (F1 = não-adversarial, MMA = adversarial)

## Plano de Correção

### Arquivo: `src/lib/gameUtils.ts`
- Remover `'tennis'` do array `NON_ADVERSARIAL`, deixando apenas `['f1']`
- Isso faz tênis aparecer no LiveFeedSection com layout "VS" correto

### Arquivo: `src/components/public/LiveNowSection.tsx`
- Também usa `isNonAdversarial` — mesma lógica, será corrigido automaticamente pela mudança no gameUtils

### Impacto
- Partidas de tênis passam a mostrar "Jogador A VS Jogador B" no feed ao vivo
- F1 continua como evento (layout centralizado sem VS)
- Nenhuma outra mudança necessária
