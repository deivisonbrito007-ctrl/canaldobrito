

## Plano de Melhorias: Agenda Brito Solutions TV

### Contexto
O app é uma agenda de transmissões esportivas ao vivo para clientes. Precisa mostrar **onde assistir** (canal de TV), usar logos reais, otimizar para mobile e remover dados mock.

---

### 1. Adicionar campo "Canal de Transmissão" ao banco de dados
- Migração SQL: adicionar coluna `broadcast_channel` (text, nullable) na tabela `games`
- Esse campo indica **onde o jogo passa** (ex: "Globo", "ESPN", "SporTV", "TNT Sports", "CazéTV", "Star+")
- Atualizar o formulário Admin para incluir campo de canal com sugestões pré-definidas
- Atualizar a Edge Function `sync-daily-games` para mapear canais automaticamente por liga (ex: Brasileirão = "Premiere/Globo", NBA = "ESPN/TNT Sports", Champions = "TNT Sports/Max")

### 2. Adicionar logos de times e ligas via APIs
- Usar URLs de logo das APIs existentes (API-Football já retorna `fixture.teams.home.logo` e `fixture.league.logo`)
- Atualizar a Edge Function para salvar `home_team_logo`, `away_team_logo` e `league_icon` no banco
- No `GameCard` e `GameDetail`, exibir `<img>` com a logo do time em vez do emoji genérico do esporte
- Fallback: se não houver logo, usar a primeira letra do time em um círculo colorido

### 3. Exibir canal de transmissão nos cards
- Mostrar o canal no `GameCard` com ícone de TV (ex: "📺 ESPN")
- No `GameDetail`, exibir canal em destaque
- No `ShareWhatsApp`, incluir canal na mensagem

### 4. Otimização Mobile (prioridade alta)
- **Header**: mostrar logo menor + data compacta no mobile, sem texto "Agenda Brito Solutions TV"
- **SportFilter**: scroll horizontal com snap, botões menores no mobile
- **GameCard**: layout compacto em coluna única, fonte menor, padding reduzido
- **GameDetail Dialog**: usar `Drawer` (bottom sheet) no mobile em vez de Dialog centralizado
- **Container**: padding lateral menor (px-3 em vez de px-4)
- **WhatsApp FAB**: posição `bottom-4 right-4` com tamanho menor no mobile
- **Footer**: mais compacto

### 5. Remover mock data e limpar fallback
- Remover `src/data/mockGames.ts` completamente
- No `Index.tsx`, remover o fallback para mockGames -- se não houver jogos no banco, mostrar mensagem vazia
- Se o banco estiver vazio, exibir "Nenhuma transmissão programada para hoje"

### 6. Melhorias visuais e UX
- Ordenar jogos: ao vivo primeiro, depois agendados por horário, encerrados por último
- Adicionar filtro rápido "Ao Vivo" no `SportFilter`
- Card ao vivo com borda pulsante verde mais visível
- Mostrar horário de forma proeminente nos cards agendados

### 7. Mapeamento automático de canais por liga

Tabela de referência que será usada na Edge Function:

```text
Liga                    Canal Principal
─────────────────────── ──────────────────
Brasileirão Série A     Premiere / Globo
Copa do Brasil          Globo / SporTV / Amazon Prime
Libertadores            ESPN / Paramount+
Champions League        TNT Sports / Max
Premier League          ESPN / Star+
La Liga                 ESPN / Star+
Serie A (Itália)        ESPN / Star+
Ligue 1                 CazéTV
Bundesliga              CazéTV / OneFootball
NBA                     ESPN / TNT Sports
CS2 / LoL / Valorant    YouTube / Twitch
UFC / MMA               Combate / UFC Fight Pass
```

---

### Detalhes Técnicos

**Migração SQL:**
```sql
ALTER TABLE public.games ADD COLUMN broadcast_channel text;
```

**Arquivos a criar/editar:**
- `supabase/migrations/` — nova migração para `broadcast_channel`
- `supabase/functions/sync-daily-games/index.ts` — salvar logos + mapear canais
- `src/types/sports.ts` — adicionar `broadcastChannel` ao tipo `Game`
- `src/hooks/useGames.ts` — mapear novo campo
- `src/components/GameCard.tsx` — logos reais + canal + layout mobile
- `src/components/GameDetail.tsx` — canal + drawer mobile + logos
- `src/components/Header.tsx` — responsivo mobile
- `src/components/SportFilter.tsx` — compacto mobile
- `src/components/FeaturedGames.tsx` — ajustes mobile
- `src/components/GameSection.tsx` — ordenação + mobile
- `src/components/ShareWhatsApp.tsx` — incluir canal
- `src/pages/Index.tsx` — remover mock fallback + ordenação
- `src/pages/Admin.tsx` — campo canal no form
- Deletar `src/data/mockGames.ts`

