

# Melhorar Visualização Mobile — Ao Vivo e Informações

## Problemas Identificados (screenshot)

1. **Estado vazio "Ao Vivo"** ocupa muito espaço vertical (padding `p-6` + ícone grande) — empurra o conteúdo principal para baixo
2. **Carrossel Novidades** — texto sobrepõe a imagem de fundo, dificultando leitura; metadados (tipo, ano, temporadas, gêneros) ficam apertados e pequenos demais em 320-384px
3. **Cards de jogos (Programação)** — competition badge com texto longo (`"Campeonato Brasileiro"`) quebra layout; nomes de times longos truncam sem contexto
4. **Filtros duplos** (competição + canal) na Programação ocupam 2 linhas de scroll horizontal — confuso no mobile
5. **ChannelBadge** com emoji + texto fica apertado em telas pequenas

## Plano de Melhorias

### 1. Estado vazio "Ao Vivo" mais compacto
- Reduzir padding de `p-6` para `p-4`
- Usar layout horizontal (ícone à esquerda, texto à direita) em vez de vertical centralizado
- Resultado: ~40% menos altura

### 2. Carrossel Novidades — melhorar legibilidade mobile
- Aumentar gradiente inferior (`from-black/95`) para garantir contraste do texto
- Reorganizar metadados em layout mais espaçado: badges maiores (`text-[11px]`), gap maior
- Título: manter `text-2xl` mas adicionar text-shadow mais forte
- Overview: esconder em telas `< 380px` ou reduzir para 1 linha

### 3. Cards de jogos (Programação) — layout otimizado
- Competition badge: abreviar nomes longos no mobile (ex: "Camp. Brasileiro" em vez de "Campeonato Brasileiro")
- Times: aumentar fonte para `text-[15px]` no mobile para melhor legibilidade
- Horário: mover para canto superior direito como badge compacto, liberando espaço central para os times
- Channels: limitar a 3 no mobile (já limita a 4)

### 4. Filtros unificados
- Combinar competição e canal em uma única barra de filtros com separador visual
- Adicionar ícones nos filtros para identificação rápida sem ler texto

### 5. ChannelBadge mobile
- Em telas pequenas, usar apenas emoji + abreviação (ex: "ESPN" fica "📺 ESPN", mas "Prime Video" fica "▶️ Prime")
- Reduzir padding horizontal

### Arquivos alterados
- `src/components/public/LiveNowSection.tsx` — estado vazio compacto
- `src/components/public/NewsReleasesSection.tsx` — gradientes e espaçamento
- `src/components/public/DailyGamesSection.tsx` — layout dos cards e filtros
- `src/components/public/ChannelBadge.tsx` — ajustes de tamanho mobile

