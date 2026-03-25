

# Verificação do Sistema — Resultado e Correção Pendente

## Status Atual: Sistema Saudável

- Zero erros no console do navegador
- Todas as requisições de rede (Supabase, TMDB proxy) retornando status 200
- Página pública renderizando corretamente com skeletons, content-visibility e trailer pre-fetch funcionando
- Painel admin acessível e funcional

## Problema Pendente: Duplicatas em daily_games

O único problema real identificado é a ausência de validação de duplicatas ao inserir jogos via ProgramacaoTexto ou DailyGamesManager. Isso já foi diagnosticado nas mensagens anteriores.

### Plano de Correção (3 arquivos)

#### 1. `src/hooks/useDailyGames.ts` — Dedup automático no insert
- No `useInsertDailyGames`, antes de inserir, buscar jogos existentes na mesma `date`
- Criar chave normalizada: `home_team.toLowerCase().trim() + away_team.toLowerCase().trim() + game_time`
- Filtrar jogos que já existem e retornar contagem de ignorados
- Deletar automaticamente duplicatas existentes no banco (mesma chave composta, manter apenas o primeiro registro)

#### 2. `src/components/admin/ProgramacaoTexto.tsx` — Alerta visual + auto-deselect
- Após parsear o texto, consultar jogos existentes no banco para a data
- Marcar jogos duplicados com badge "Duplicado" amarelo na preview
- Desmarcar jogos duplicados por padrão (`selected = false`)
- Admin ainda pode forçar seleção manual se quiser

#### 3. `src/components/admin/DailyGamesManager.tsx` — Guard no formulário manual
- Antes de inserir jogo avulso, verificar existência por chave composta
- Mostrar toast de aviso se duplicado detectado

### Limpeza automática
- Ao carregar jogos no admin (`useAllDailyGames`), detectar e deletar duplicatas automaticamente mantendo o registro mais antigo (por `created_at`)

### Arquivos modificados
- `src/hooks/useDailyGames.ts`
- `src/components/admin/ProgramacaoTexto.tsx`
- `src/components/admin/DailyGamesManager.tsx`

