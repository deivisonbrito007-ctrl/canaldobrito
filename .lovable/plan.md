

## Auditoria Completa e Reestruturação — Agenda Brito Solutions TV

### Problemas Identificados

1. **Esports dominando o app**: 100% dos dados atuais são esports (CS2, Valorant, Dota 2, LoL). Esses jogos não passam em TV aberta/fechada brasileira — não fazem sentido para o público-alvo.
2. **Futebol e NBA sem dados**: A API-Football não retornou jogos (provavelmente limite de requisições do plano free ou temporada). NBA idem.
3. **Tipo "esports" e "mma" no filtro**: Ocupam espaço desnecessário. O foco deve ser futebol e basketball (que passam na TV).
4. **Interface genérica**: Falta identidade visual profissional. Cards pequenos, sem hierarquia visual clara do canal de transmissão.
5. **Canal de transmissão pouco visível**: Está em texto pequeno no rodapé do card. Deveria ser a informação principal.
6. **Falta seção "Onde Assistir"**: O propósito do app é dizer ONDE passa, mas o canal fica escondido.
7. **Sem agrupamento por horário**: Clientes querem ver "o que passa às 16h, às 19h, às 21h".
8. **Sem fallback visual quando não há jogos de futebol**: Tela vazia sem contexto.

---

### Plano de Implementação

#### 1. Remover Esports e MMA do sistema
- Atualizar `SPORTS` em `src/types/sports.ts` para manter apenas **Futebol** e **Basketball**
- Remover `esports` e `mma` do tipo `SportType`
- Atualizar Edge Function para NÃO buscar PandaScore (esports)
- Limpar dados de esports do banco via DELETE
- Simplificar o `SportFilter` para mostrar apenas Todos / Futebol / Basketball

#### 2. Redesign profissional dos GameCards
- **Canal de transmissão como elemento principal**: Exibir em destaque no topo do card com ícone de TV e cor do canal
- **Horário grande e claro**: Para jogos agendados, mostrar horário em fonte grande
- **Layout mobile-first**: Card horizontal com time casa | placar/hora | time visitante
- **Cores por canal**: Globo (azul), ESPN (vermelho), SporTV (verde), TNT Sports (roxo)
- **Badge de campeonato** com logo real no topo

#### 3. Agrupamento por horário no Index
- Em vez de agrupar por esporte/liga, agrupar por **faixa horária**: "Manhã", "Tarde", "Noite", "Madrugada"
- Dentro de cada faixa, ordenar por horário exato
- Mostrar separadores visuais claros

#### 4. Header profissional
- Logo maior e mais profissional
- Mostrar data formatada em português com dia da semana
- Contador de jogos do dia ("12 transmissões hoje")
- Barra de status: "X ao vivo agora" com animação pulsante

#### 5. Edge Function — focar em dados reais de TV
- Manter API-Football para futebol (já configurado)
- Manter BallDontLie para NBA
- **Remover PandaScore** (esports)
- Melhorar mapeamento de canais com mais ligas brasileiras:
  - Copa do Nordeste → SporTV / ESPN
  - Campeonato Paulista → Record / CazéTV
  - Campeonato Carioca → Band / SporTV
  - Copa Sul-Americana → Paramount+
  - Supercopa → Globo
- Adicionar logs detalhados para debug quando APIs não retornam dados

#### 6. Estado vazio profissional
- Quando não há jogos: mostrar mensagem elegante com próximo jogo disponível
- "Nenhuma transmissão programada para hoje. Volte amanhã!"
- Sugestão: botão para o admin adicionar jogos manualmente

#### 7. Tela de detalhe (GameDetail) melhorada
- Canal de transmissão em DESTAQUE (maior, com cor)
- Informações do campeonato, rodada, estádio
- Botão "Lembrar" (futuro)
- Layout drawer mobile mantido mas com mais informações

#### 8. Melhorias no Admin
- Remover esports/mma do select de esportes
- Permitir múltiplos canais (ex: "Globo / SporTV")
- Input de texto livre para canal + sugestões

---

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/types/sports.ts` | Remover esports/mma, manter football/basketball |
| `src/components/GameCard.tsx` | Redesign completo: canal em destaque, layout profissional |
| `src/components/GameDetail.tsx` | Canal em destaque, mais info |
| `src/components/Header.tsx` | Layout profissional com contadores |
| `src/components/SportFilter.tsx` | Simplificar (só Todos/Futebol/Basketball) |
| `src/components/GameSection.tsx` | Agrupar por horário em vez de esporte |
| `src/pages/Index.tsx` | Nova estrutura de agrupamento |
| `src/pages/Admin.tsx` | Remover esports/mma, melhorar form canal |
| `src/index.css` | Cores por canal de TV, animações |
| `supabase/functions/sync-daily-games/index.ts` | Remover PandaScore, mais ligas BR, melhor mapeamento |
| Banco de dados | DELETE jogos de esports existentes |

### Sugestao extra
- **Adicionar jogos manualmente pelo Admin** quando as APIs não retornam dados (temporada parada, limites de API). Isso garante que o app sempre tenha conteúdo para os clientes.

