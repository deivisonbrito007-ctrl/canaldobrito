

# Análise dos Cards Ao Vivo — Melhorias Identificadas

## O que está funcionando bem
- Nomes dos times NBA aparecem completos (Golden State Warriors, Brooklyn Nets, etc.)
- Tennis em "Eventos Ao Vivo" com layout centralizado e "Indian Wells" como detalhe
- Indicador pulsante de live e tempo decorrido funcionando

## Problemas Identificados na Imagem

1. **Card de Vôlei cortado** — "Osasco/São Cristóvão (F)" aparece sem adversário visível; parece que o away_team existe mas o card está muito apertado para mostrar os dois times + separador "X"
2. **Competição genérica** — O card de vôlei mostra apenas "VÔLEI" como competição, sem o nome da liga (ex: "Superliga Feminina"). Isso é um problema de dados, mas podemos melhorar a exibição.
3. **Horário com fundo verde inconsistente** — Alguns cards mostram o horário "21:00" com fundo verde e outros sem, criando inconsistência visual
4. **Emoji de tênis incorreto** — Na imagem aparece 🏓 (pingue-pongue) em vez de 🎾 (tênis) no card de "TÊNIS"

## Correções Planejadas

### 1. Melhorar o card de vôlei/esportes com nomes longos
**`LiveNowSection.tsx`**: Quando ambos os times têm nomes longos (>15 chars), usar layout empilhado vertical (home em cima, "X" no meio, away embaixo) em vez de horizontal, para evitar truncamento.

### 2. Mostrar nome da competição real em vez do tipo de esporte
**`LiveNowSection.tsx` e `LiveEventsSection.tsx`**: A label de competição já usa `game.competition` — se o dado vier apenas como "Vôlei", mostrar `competition_detail` ao lado quando disponível (ex: "🏐 VÔLEI · Superliga Feminina").

### 3. Uniformizar estilo do horário
**`LiveNowSection.tsx`**: Remover fundo verde do horário e manter estilo consistente (texto muted sem background) em todos os cards.

### 4. Verificar emoji de tênis
**`gameUtils.ts`**: Confirmar que `SPORT_EMOJI.tennis = '🎾'` está correto (já está no código). O problema pode ser de renderização de fonte ou dado vindo do banco com emoji errado.

## Arquivos
- `src/components/public/LiveNowSection.tsx` — layout vertical para nomes longos, estilo do horário
- `src/components/public/LiveEventsSection.tsx` — competição + detalhe combinados
- `src/lib/gameUtils.ts` — verificação de emojis

