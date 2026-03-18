

# Refatoracao: Programacao mostra APENAS jogos ao vivo + Banners organizados por categoria + Edge Function API-Football

## Resumo

Tres mudancas principais:
1. **DailyGamesSection** deixa de existir como secao separada — a area de "Programacao" passa a mostrar APENAS jogos ao vivo (unificando com LiveNowSection)
2. **BannerSections** ja exibidas na home organizadas por categoria (Futebol, UFC, Demais Esportes etc.) — garantir que aparecem na home apos o hero
3. **Edge Function `sync-daily-games`** para puxar jogos da API-Football automaticamente

## Estrutura Final da Home

```text
Header
Hero (Daily Banners)
🔴 Ao Vivo Agora (UNICA secao de jogos — so mostra ao vivo)
📺 Banners por Categoria (Futebol, Basquete, UFC, Demais Esportes, Guia)
✨ Novidades (Stories)
▶ Assista Hoje (Grid)
Footer
```

## Mudancas

### 1. `src/pages/Index.tsx`
- Remover import e uso de `DailyGamesSection`
- Adicionar `BannerSections` apos `LiveNowSection`
- Ordem: Header → Hero → LiveNow → BannerSections → Novidades → Assista Hoje → Footer

### 2. `src/components/public/LiveNowSection.tsx`
- Renomear titulo para "Programacao Ao Vivo" com badge pulsante
- Manter logica atual (so mostra jogos cujo horario esta dentro da janela de 2h)
- Adicionar mensagem quando nao ha jogos ao vivo: "Nenhum jogo ao vivo no momento"
- Mostrar secao sempre (com mensagem vazia) em vez de retornar null

### 3. `src/components/public/BannerSections.tsx`
- Ja existe e funciona — sera adicionado a Index.tsx
- Nenhuma mudanca no componente

### 4. Edge Function `sync-daily-games`
- **Novo arquivo:** `supabase/functions/sync-daily-games/index.ts`
- Recebe `{ date: "YYYY-MM-DD" }` via POST
- Busca jogos da API-Football: `GET https://v3.football.api-sports.io/fixtures?date={date}&timezone=America/Sao_Paulo`
- Usa secret `API_FOOTBALL_KEY` (ja configurado)
- Mapeia campos: teams.home.name → home_team, teams.away.name → away_team, league.name → competition, league.round → competition_detail, fixture.date → game_time
- Detecta feminino via "(W)" ou "Women" no nome
- Evita duplicatas por home_team + away_team + date
- Insere na tabela `daily_games`
- Retorna contagem de jogos importados

### 5. `src/components/admin/DailyGamesManager.tsx`
- Adicionar botao "Buscar da API" ao lado de "Adicionar"
- Chama `supabase.functions.invoke("sync-daily-games", { body: { date: selectedDate } })`
- Toast com resultado

### 6. Remover `DailyGamesSection.tsx` (arquivo pode ficar mas nao sera importado)
- A secao de programacao futura nao aparece mais — banners cobrem essa informacao

## Sugestoes Adicionais

- **Dicionario de canais**: criar mapeamento competicao → canais brasileiros tipicos para pre-preencher automaticamente (ex: "UEFA Champions League" → ["TNT", "Max"])
- **Auto-sync via cron**: agendar busca diaria automatica as 6h
- **Status ao vivo via API**: usar endpoint `live=all` da API-Football para atualizar `is_live` em tempo real

