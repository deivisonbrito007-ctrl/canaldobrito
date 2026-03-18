

# Remover API de Jogos + "Ao Vivo" Automático por Horário (90min)

## Resumo
Remover a edge function `sync-daily-games` e o botao "Buscar da API". A secao "Ao Vivo" sera **100% automatica** — nenhuma acao do admin necessaria. O sistema identifica os jogos que estao ao vivo comparando a hora atual com o `game_time` de cada jogo. Se `hora_atual >= game_time` e `hora_atual < game_time + 90min`, o jogo aparece como ao vivo. Apos 90 minutos, sai automaticamente.

O campo `is_live` do banco deixa de ser usado como controle manual. A logica e puramente client-side baseada no horario.

## Mudancas

### 1. Deletar `supabase/functions/sync-daily-games/index.ts`

### 2. Admin (`DailyGamesManager.tsx`)
- Remover `handleSyncFromAPI`, estado `syncing`, botao `Download`
- Remover botao toggle `is_live` (Zap) — nao e mais necessario, o sistema e automatico
- Manter: adicionar manual, editar, toggle active, excluir

### 3. LiveNowSection (`LiveNowSection.tsx`)
- Remover todos os mock data
- Nova logica automatica:
  - Buscar todos os jogos do dia com `active = true`
  - Para cada jogo, calcular se esta ao vivo: `agora >= game_time` E `agora < game_time + 90min`
  - Timer local de 60s para re-avaliar (jogos entram e saem automaticamente)
- Se nenhum jogo ao vivo no momento -> `return null` (secao invisivel)
- Label fixo "AO VIVO"

### 4. DailyGamesSection (`DailyGamesSection.tsx`)
- Mostrar todos os jogos do dia
- Jogos dentro da janela de 90min ganham badge pulsante "● AO VIVO" automaticamente

### 5. Sugestao: funcao utilitaria compartilhada
- Criar funcao `isGameCurrentlyLive(game_time, date)` reutilizavel em ambos componentes
- Usa fuso horario de Sao Paulo (`America/Sao_Paulo`) para consistencia

## Fluxo
1. Admin adiciona jogos na aba Programacao por Texto (como ja faz)
2. Quando chega o horario do jogo -> aparece automaticamente na secao "Ao Vivo"
3. Apos 90min do horario -> sai automaticamente
4. Jogo permanece na Programacao completa com badge "AO VIVO" enquanto estiver no horario

## Arquivos

| Arquivo | Acao |
|---------|------|
| `supabase/functions/sync-daily-games/index.ts` | Deletar |
| `src/components/admin/DailyGamesManager.tsx` | Remover botao API e toggle Zap |
| `src/components/public/LiveNowSection.tsx` | Logica automatica por horario |
| `src/components/public/DailyGamesSection.tsx` | Mostrar todos + badge ao vivo automatico |

