## Auditoria atual da aba Programação

Arquivos: `ScheduleTab.tsx` → `DailyGamesSection.tsx` (771 linhas, monolítico) + `DayStatsBar`, `NextGameHero`.

### Pontos fortes (mantém)
- Lógica de live, countdown e detecção de esporte está sólida (`gameUtils.ts` cobre 14 esportes).
- Filtros acordeão (Esporte/Competição/Canal), reminders, push e collapsibles para Manhã/Tarde/Noite/Madrugada já funcionam.
- Touch targets ≥44px em quase todos os botões.

### Problemas identificados (UI/profissionalismo)
1. **Cards visualmente "iguais"**: o esporte aparece só num badge minúsculo de 8px no topo. À distância tudo parece futebol. Não há identidade visual por esporte.
2. **Hierarquia confusa**: badge esporte + badge competição + badge highlight + badge "em X" + badge "AO VIVO" + badge "FEM" + sino — até 6 elementos competindo por atenção na primeira linha em mobile 360px.
3. **Cores aleatórias por competição** (`COMP_COLORS`) com dezenas de hex hardcoded. Não usa design tokens, conflita com tema dark.
4. **Mobile <360px**: a linha de times (`Time A — 21:00 vs — Time B`) quebra com competições longas; o "vs" minúsculo se perde; competition_detail aparece duplicado em alguns layouts.
5. **DayStatsBar redundante** com a linha de cabeçalho que já mostra "X jogos · Y ao vivo".
6. **Sem indicação visual de quem está jogando agora** versus quem é próximo — só o badge "AO VIVO" pequeno.
7. **Sem empty states por filtro**: se filtrar e não houver resultado, some tudo silenciosamente.
8. **Acessibilidade**: alguns botões só com emoji sem label, contrastes border/40 muito sutis no dark.

## Plano

### Etapa 1 — Refatoração estrutural
Quebrar `DailyGamesSection.tsx` (771 linhas) em arquivos pequenos:
- `schedule/GameCard.tsx`
- `schedule/GameCardSportTheme.ts` (mapa central de cores/gradientes/ícones por esporte)
- `schedule/PeriodGroup.tsx`
- `schedule/TomorrowSection.tsx`
- `schedule/ScheduleFilters.tsx`
- `schedule/ScheduleHeader.tsx`
- `DailyGamesSection.tsx` vira só orquestração (~150 linhas)

Sem mudança de comportamento aqui — só organização para os testes ficarem focados.

### Etapa 2 — Novo design dos cards (diferenciação por esporte)
Cada esporte ganha **identidade visual completa**:

```text
┌─────────────────────────────────────────┐
│ ⚽ FUTEBOL │ Brasileirão · Rodada 12     │  ← faixa colorida do esporte
├─────────────────────────────────────────┤
│                                         │
│  Flamengo            21:00       Palmeiras │
│                       VS                │
│  ─────────────       em 2h      ─────── │
│                                         │
│ 📺 Globo  Premiere  +1                  │
└─────────────────────────────────────────┘
```

- **Faixa colorida superior** com gradiente do esporte (não só 3px — ~24px com label "FUTEBOL", "BASQUETE" etc.) e ícone grande.
- **Paleta semântica por esporte** em `index.css` como tokens HSL: `--sport-football`, `--sport-basketball`, etc. Sem hex direto.
- **Watermark sutil** do ícone do esporte no canto direito do card (opacidade 6%).
- **Layout de times**: nomes em coluna lateral, hora central com countdown abaixo, "VS" só quando faz sentido (omitido em F1/MMA/Surf/etc.).
- **Estado AO VIVO**: borda animada verde + selo "AO VIVO" maior + minuto da partida quando disponível.
- **Estado destaque** (Champions, Brasileirão, etc.): glow sutil na borda + ícone 🔥 fixo no topo direito.
- **Card variants** baseados em `cva`: `default | live | upcoming | highlight` para estados consistentes.

### Etapa 3 — Header e stats consolidados
- Substituir `DayStatsBar` + linha de header atual por um único **ScheduleHeader** com pills horizontais limpas:
  ```text
  [Hoje · Ter, 6 mai] [12 jogos] [3 AO VIVO ●] · [⚽12] [🏀3] [🎾2]
  ```
- Tudo em uma linha, com scroll horizontal só quando exceder.
- Tipografia em Bebas Neue para os números (chama atenção sem pesar).

### Etapa 4 — Empty states + feedback
- Quando filtros não retornam resultado: mensagem dedicada com botão "Limpar filtros".
- Quando próximo evento é >12h: esconder o `NextGameHero` (atualmente mostra sempre, fica esquisito de manhã sem jogos próximos).
- Skeleton novo já refletindo o layout novo.

### Etapa 5 — Compatibilidade mobile real
Vou testar no browser nos viewports 320px, 360px, 390px, 430px:
- Garantir nenhum `overflow-x` indesejado.
- Times com nome longo: truncate com title atributo no hover/long-press.
- Filtros: ainda scroll horizontal, mas com fade nas bordas indicando mais conteúdo.
- Testar com 0 jogos, 1 jogo, 30 jogos, jogo longe (madrugada de amanhã), jogo ao vivo agora.

### Etapa 6 — Testes
Adicionar/atualizar:
- `src/components/public/schedule/__tests__/GameCard.test.tsx` — render por esporte, estado live, estado upcoming, reminder toggle.
- `src/components/public/schedule/__tests__/ScheduleFilters.test.tsx` — filtro por esporte/comp/canal, clear all.
- `src/components/public/schedule/__tests__/PeriodGroup.test.tsx` — collapse/expand.
- `src/components/public/__tests__/DailyGamesSection.test.tsx` — empty state, loading, com dados.
- Manter os testes existentes (`useDailyGames`, `NextGameHero`) passando.

Rodar a suíte completa via `lovable-exec test` após implementação.

### Etapa 7 — Verificação final em preview
Usar o browser tool para:
1. Abrir aba Programação em 360x800 e 414x896.
2. Screenshot de cada estado (loading, dados, filtrado, empty).
3. Verificar console limpo (sem warnings de forwardRef etc.).
4. Confirmar que reminders persistem em localStorage.

## Arquivos criados / editados

**Novos:**
- `src/components/public/schedule/GameCard.tsx`
- `src/components/public/schedule/GameCardSportTheme.ts`
- `src/components/public/schedule/PeriodGroup.tsx`
- `src/components/public/schedule/TomorrowSection.tsx`
- `src/components/public/schedule/ScheduleFilters.tsx`
- `src/components/public/schedule/ScheduleHeader.tsx`
- `src/components/public/schedule/EmptyFilterState.tsx`
- 4 arquivos de teste em `schedule/__tests__/`

**Editados:**
- `src/components/public/DailyGamesSection.tsx` (reduzido a orquestração)
- `src/components/public/ScheduleTab.tsx` (sem mudança visível, garantir padding consistente)
- `src/components/public/DayStatsBar.tsx` (removido — funcionalidade migrada para ScheduleHeader)
- `src/components/public/NextGameHero.tsx` (esconder se >12h até próximo)
- `src/index.css` (novos tokens `--sport-*` HSL)

**Não muda:**
- `src/lib/gameUtils.ts` — lógica de detecção e tempo já está boa
- `src/hooks/useDailyGames.ts`, `usePushSubscription.ts`
- Auth, banco, RLS

## Sugestões adicionais (não implemento sem aprovar)

1. **Pin "Meus times"**: usuário marca times favoritos no localStorage e eles aparecem no topo da lista com destaque dourado.
2. **Compartilhar jogo individual** via WhatsApp: botão de share no card que gera deep link `/s/jogo/{id}` (precisa rota e parser pra reabrir o card).
3. **Notificação de gol** (não só lembrete): quando jogo está ao vivo e o status_short muda, dispara push curto. Já temos infra de push.
4. **Modo "só meus canais"**: usuário marca quais canais tem (ex: Premiere, ESPN) e a aba esconde jogos sem transmissão acessível.
5. **Resumo automático às 8h via push**: "Hoje: Flamengo vs Vasco 21h, NBA Finals 23h, F1 Mônaco 10h". Depende do edge function de push.
6. **Modo TV (landscape)**: detecta orientação e mostra um grid 4 colunas otimizado para tablet/TV.
7. **Indicador de "começou agora"**: jogo que ficou live nos últimos 5 min ganha um pulso especial verde durante esse intervalo.
