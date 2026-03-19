

# Plano Revisado — Dashboard Admin (sem card de Jogos)

## Contexto
Os jogos ao vivo já aparecem na home pública (puxados da aba Programação). O card "Jogos do Dia" / "Ao Vivo" no dashboard é desnecessário.

## O que será feito

### 1. Melhorias no Dashboard (`AdminDashboard.tsx`)
- Adicionar `cursor-pointer` nos stat cards
- Adicionar **Skeleton loading** enquanto os dados carregam (em vez de mostrar "0")
- Uniformizar contagens: Banners atualmente conta só ativos, os demais contam total. Padronizar mostrando **total** com subtitle "X ativos" em cada card
- Simplificar a lógica de navegação do `onClick` (remover ternários encadeados)

### 2. Nenhum card de Jogos no Dashboard
- Manter os 4 cards existentes (Banners, Filmes, Séries, Novidades) — sem adicionar card de jogos

### 3. Agendamento de Banners por Categoria
- Adicionar coluna `publish_at` (timestamptz, nullable) na tabela `banners`
- No `AdminBanners.tsx`, adicionar campo opcional "Agendar para" (datetime-local) na criação de banner
- Se preenchido, banner é criado com `active = false` e `publish_at` definido
- Badge "⏰ Agendado" nos banners pendentes

### 4. Agendamento da Programação por Texto
- Adicionar coluna `publish_at` (timestamptz, nullable) na tabela `daily_games`
- No `ProgramacaoTexto.tsx`, adicionar toggle **"Agendar para meia-noite"** com seletor de data
- Quando ativo, jogos são criados com `active = false` e `publish_at = data_do_jogo 00:00:00`

### 5. Edge Function para ativação automática
- Criar `supabase/functions/activate-scheduled/index.ts`
- Faz `UPDATE ... SET active = true WHERE publish_at <= now() AND active = false` em ambas as tabelas
- Configurar pg_cron para chamar a cada minuto

## Arquivos

| Arquivo | Ação |
|---------|------|
| `AdminDashboard.tsx` | Skeleton, cursor-pointer, uniformizar contagens, simplificar nav |
| `AdminBanners.tsx` | Campo "Agendar para", badge agendado |
| `ProgramacaoTexto.tsx` | Toggle "Agendar para meia-noite" |
| `useBanners.ts` | Suporte a `publish_at` na criação |
| `useDailyGames.ts` | Suporte a `publish_at` na inserção |
| `activate-scheduled/index.ts` | Nova edge function |
| Migração SQL | Colunas `publish_at` em banners e daily_games + pg_cron job |

