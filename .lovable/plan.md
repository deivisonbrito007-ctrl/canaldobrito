

## Auditoria e Correções do Portal

### Problemas encontrados nos testes (3 falhas em 121)

**1. LiveNowHero.test.tsx — 2 testes falhando**
O mock de `@/lib/gameUtils` não exporta `SPORT_LABEL` e `SPORT_BADGE_BG`, que foram adicionados ao módulo depois do teste ser escrito. O componente `LiveNowHero` usa `SPORT_LABEL[sportType]` na linha 110 e o teste quebra.

**Correção:** Atualizar o mock em `LiveNowHero.test.tsx` para incluir `SPORT_LABEL`, `SPORT_BADGE_BG` e `SPORT_DURATION` nas exportações mockadas.

**2. ProgramacaoTexto.test.tsx — 1 teste falhando**
O teste "detects date from header like 'AGENDA ESPORTIVA — SEXTA 27/03'" espera data `2026-03-27`, mas o auto-bump de madrugada (implementado na última alteração) avança jogos com horário `03:00` para o dia seguinte (`2026-03-28`).

**Correção:** Atualizar o teste para esperar `2026-03-28` (comportamento correto com auto-bump) e adicionar comentário explicativo.

---

### Sugestões de melhoria para o Dashboard Admin

**3. Donut chart sem legenda visível**
O `ContentCharts` tem um donut chart mas não mostra legenda — o usuário só entende as cores pelo tooltip. Adicionar legendas compactas abaixo do gráfico com cor + label + percentual.

**4. Atividade Recente sem jogos**
O `RecentActivity` mostra banners, filmes, séries e novidades mas ignora jogos (`daily_games`). Incluir jogos no feed com ícone de troféu.

**5. Dashboard sem indicador de jogos de madrugada**
Após a implementação do auto-bump, seria útil mostrar no dashboard quantos jogos tiveram data ajustada (madrugada) para auditoria rápida.

---

## Plano de implementação

### Passo 1 — Corrigir LiveNowHero.test.tsx
Atualizar o `vi.mock("@/lib/gameUtils")` para incluir todas as exportações usadas pelo componente: `SPORT_LABEL`, `SPORT_BADGE_BG`, `SPORT_DURATION`.

### Passo 2 — Corrigir ProgramacaoTexto.test.tsx
Alterar a expectativa do teste de `2026-03-27` para `2026-03-28` (jogo às 03:00 = madrugada = dia seguinte).

### Passo 3 — Adicionar legendas ao donut chart
Adicionar lista de legendas compacta abaixo do `PieChart` em `ContentCharts.tsx` com bolinha colorida + nome + valor.

### Passo 4 — Incluir jogos no feed de Atividade Recente
Adicionar `daily_games` ao `RecentActivity` recebendo os dados via props e exibindo com ícone `Trophy`.

### Passo 5 — Rodar suíte de testes completa
Executar `vitest run` para confirmar 0 falhas.

