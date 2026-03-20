

# Melhorias UX/UI na Aba Programação

## Análise atual

A aba Programação é funcional mas básica: um SectionHeader seguido de filtros (esporte, competição, canal) e cards agrupados por período. Oportunidades de melhoria:

1. **Sem resumo visual do dia** — o usuário não tem uma visão rápida antes de rolar
2. **3 linhas de filtros empilhadas** — ocupa muito espaço vertical, confuso
3. **Cards sem interatividade** — não há ação ao tocar (ex: notificação, lembrete)
4. **Sem contagem regressiva** — jogos próximos não têm destaque temporal
5. **Sem "próximo jogo"** — não há hero/destaque para o jogo mais iminente
6. **Filtros estáticos** — competições hardcoded, não refletem os dados reais do dia

## Plano de melhorias

### 1. Hero "Próximo Jogo" no topo
Card destacado com o próximo jogo que ainda não começou:
- Fundo com gradiente da cor da competição
- Contagem regressiva animada ("Começa em 1h 23min")
- Times em destaque grande
- Canais e emoji do esporte
- Desaparece quando o jogo fica ao vivo (migra para LiveNowSection)

### 2. Resumo visual do dia (Stats Bar)
Barra horizontal compacta logo abaixo do hero:
- Total de jogos | Ao vivo agora | Próximas horas
- Ícones dos esportes presentes no dia com contagem
- Atualiza a cada 60s

### 3. Filtros unificados em uma única linha
Combinar os 3 filtros (esporte, competição, canal) em um sistema de tabs compacto:
- Primeira linha: pills de esporte (já existem, manter)
- Segunda linha: combinar competição + canal em uma única barra com separador visual
- Remover filtros hardcoded — gerar dinamicamente a partir dos jogos do dia
- Mostrar contagem de jogos ao lado de cada filtro ativo

### 4. Cards com micro-interações
- Adicionar botão "🔔" para lembrete (salva no localStorage, dispara notificação do browser)
- Indicador "Começa em Xmin" para jogos nas próximas 2 horas (amarelo pulsante)
- Swipe horizontal no card para revelar ação de compartilhar via WhatsApp
- Transição suave quando jogo muda de "agendado" para "ao vivo"

### 5. Separadores de período mais visuais
Em vez de apenas emoji + texto + linha:
- Ícone animado (sol girando, lua com estrelas)
- Quantidade de jogos do período no badge
- Colapsável (tap para esconder/mostrar jogos do período)

### 6. Empty state persuasivo
Quando não há jogos com o filtro ativo:
- Ilustração SVG temática
- Sugestão de remover filtros
- Botão "Ver todos os jogos"

## Arquivos modificados

- `src/components/public/ScheduleTab.tsx` — adicionar hero "Próximo Jogo" e stats bar
- `src/components/public/DailyGamesSection.tsx` — filtros dinâmicos, cards interativos, períodos colapsáveis
- `src/components/public/NextGameHero.tsx` — novo componente hero com contagem regressiva
- `src/components/public/DayStatsBar.tsx` — novo componente resumo do dia
- `src/lib/gameUtils.ts` — helper `getNextUpcomingGame()` e `getTimeUntilStart()`

## Prioridade de impacto

1. Hero "Próximo Jogo" com countdown — maior impacto visual e engajamento
2. Filtros dinâmicos — remove dados hardcoded, mais inteligente
3. Stats bar — contexto rápido do dia
4. Cards interativos (lembrete + "começa em") — retenção
5. Períodos colapsáveis — organização

