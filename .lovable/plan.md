

## Auditoria da Aba Programacao + Testes + Melhorias

### Auditoria dos Componentes

| Componente | Status | Observacao |
|---|---|---|
| ScheduleTab | OK | Wrapper simples, apenas renderiza DailyGamesSection |
| DailyGamesSection | OK | 711 linhas, filtros por esporte/competicao/canal, agrupamento por periodo, skeletons, empty state |
| DayStatsBar | OK | Stats horizontais com total, ao vivo, breakdown por esporte |
| NextGameHero | OK | Proximo jogo com countdown, gradientes por competicao |
| ChannelBadge | OK | Badges estilizados por canal, responsivo com nomes curtos no mobile |
| GameCard | OK | Cards com live badge, reminder, competicao detail, acessibilidade |
| PeriodGroup | OK | Collapsible por periodo (Manha/Tarde/Noite/Madrugada) |
| Filtros | OK | Accordion com pills, chips ativos removiveis, botao limpar |

### Problemas Encontrados

**1. Sem secao de "Amanha" visivel para o usuario**
Os jogos de amanha sao carregados (`tomorrowGames`) mas so alimentam o `NextGameHero`. O usuario nao tem como ver a programacao de amanha sem esperar o dia seguinte.

**2. ScheduleTab nao tem header proprio**
A aba e apenas um wrapper com padding. Nao ha titulo ou contexto visual ao entrar na aba -- o usuario depende do header interno do DailyGamesSection.

**3. Sem cobertura de testes**
Nenhum teste cobre `DailyGamesSection`, `NextGameHero`, `DayStatsBar`, `ChannelBadge` ou `ScheduleTab`.

---

### Plano de Melhorias

#### Passo 1 -- Adicionar secao "Amanha" colapsavel
Em `DailyGamesSection.tsx`, apos os jogos de hoje, renderizar uma secao `Collapsible` com os jogos de amanha (ja carregados via `tomorrowGames`), inicialmente fechada. Mostra a data e contagem de jogos no trigger.

**Arquivo:** `src/components/public/DailyGamesSection.tsx`
- Adicionar bloco apos o `div.space-y-5` dos grupos de hoje
- Reutilizar `GameCard` para os jogos de amanha
- Agrupar por periodo da mesma forma

#### Passo 2 -- Criar testes para ChannelBadge e NextGameHero
Adicionar testes unitarios basicos para:
- `ChannelBadge`: renderiza emoji e nome corretos para canais conhecidos e fallback
- `NextGameHero`: renderiza proximo jogo com countdown, nao renderiza se nao ha jogos futuros

**Arquivos:**
- `src/components/public/__tests__/ChannelBadge.test.tsx`
- `src/components/public/__tests__/NextGameHero.test.tsx`

#### Passo 3 -- Rodar suite de testes
Executar `vitest run` para confirmar 0 falhas.

---

### Detalhes tecnicos

- A secao "Amanha" usara o mesmo `Collapsible` + `CollapsibleTrigger` do periodo, com `open={false}` por padrao
- Os testes de `NextGameHero` mockarao `getMinutesUntilStart` e `isGameCurrentlyLive` de `@/lib/gameUtils`
- Os testes de `ChannelBadge` mockarao `useIsMobile` para testar nomes curtos no mobile

