

# Diagnostico: "Ao Vivo" e "Programação" nao aparecem

## Causa raiz

Nao e um bug de codigo. A tabela `daily_games` esta vazia para a data de hoje (2026-03-19) -- todas as queries retornam `[]`. Os componentes funcionam corretamente, mas:

1. **LiveNowSection** (Home): retorna `null` quando nao ha jogos, entao fica invisivel
2. **DailyGamesSection** (Programacao): ja mostra empty state "Nenhum jogo programado para hoje" -- esta funcionando

## Plano de correcao

### 1. `src/components/public/LiveNowSection.tsx`
- Adicionar empty state visual quando nao ha jogos ao vivo, em vez de retornar `null`
- Mostrar mensagem como "Nenhum jogo ao vivo no momento" com indicador visual
- Assim a secao fica sempre visivel na Home

### 2. Sugestao: Adicionar dados de teste
- Para testar ambas as secoes, cadastrar jogos para hoje no painel admin (rota `/admin` > Jogos)
- Jogos com horario proximo ao atual aparecerão automaticamente como "Ao Vivo"

## Arquivos a editar
- `src/components/public/LiveNowSection.tsx` -- adicionar empty state

