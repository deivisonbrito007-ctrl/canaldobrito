

# Unificar Seções Ao Vivo — Dados Reais + Design Novo

## Situação Atual

A página inicial renderiza apenas o `LiveFeedSection` com **dados hardcoded de exemplo**. Os componentes `LiveNowSection` e `LiveEventsSection` (que usam dados reais do banco via `useDailyGames`) existem mas **não estão na página**.

Resultado: o usuário vê sempre os mesmos 5 cards fictícios, independente de haver jogos reais.

## Plano

### 1. Atualizar `LiveFeedSection` para usar dados reais
- Importar `useDailyGames`, `isGameCurrentlyLive`, `getElapsedMinutes`, `SPORT_EMOJI`, `isNonAdversarial` de `gameUtils`
- Buscar jogos do dia e filtrar os que estão ao vivo
- Manter o design visual atual do `LiveFeedSection` (accent bar por esporte, cards 240px, channel pills) mas alimentado com dados reais
- Mapear `sport_type` do banco para o enum `Sport` do componente
- Usar `competition` + `competition_detail` para a label da liga
- Usar `channels[]` para o badge do canal (pegar o primeiro)
- Mostrar `elapsed'` quando disponível, senão "Ao vivo"
- Manter os sample data como fallback apenas quando não há jogos ao vivo (preview mode)

### 2. Separar visualmente jogos adversariais e eventos
- Dentro do mesmo `LiveFeedSection`, renderizar primeiro os jogos adversariais (futebol, basquete, vôlei) e depois os eventos não-adversariais (F1, tênis, MotoGP)
- Adicionar um pequeno divider ou sub-header "Eventos" antes dos cards de eventos, se houver ambos os tipos
- Eventos usam accent âmbar/laranja e layout centralizado
- Jogos usam accent por esporte e layout home vs away

### 3. Remover imports órfãos
- Confirmar que `LiveNowSection` e `LiveEventsSection` não são importados em nenhum lugar ativo (já não estão no Index)

## Arquivos
- `src/components/public/LiveFeedSection.tsx` — refatorar para dados reais + separação visual
- `src/pages/Index.tsx` — sem alterações (já importa LiveFeedSection)

