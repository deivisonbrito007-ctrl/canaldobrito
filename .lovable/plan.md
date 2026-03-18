

# Melhorar Programação + Remover Continue Assistindo

## Mudanças

### 1. Remover `ContinueWatchingSection` do Index (`src/pages/Index.tsx`)
- Remover import e uso do componente (linha 8 e linha 81)

### 2. Redesign completo da `DailyGamesSection` (`src/components/public/DailyGamesSection.tsx`)

**Novo agrupamento por período:**
- **🌙 Madrugada** (00:00–05:59) — jogos que na prática acontecem "no final da noite" do dia anterior, ficam por último na ordem visual
- **🌅 Manhã** (06:00–12:59)
- **☀️ Tarde** (13:00–17:59)
- **🌙 Noite** (18:00–23:59)

**Ordem de exibição:** Manhã → Tarde → Noite → Madrugada (madrugada por último pois são os jogos que viram o dia)

**Melhorias visuais no card:**
- Card mais compacto e visual premium com glassmorphism forte
- Linha de destaque colorida no topo do card (cor baseada na competição)
- Layout de times lado a lado com "vs" centralizado estilizado
- Horário em destaque com fundo semitransparente e ícone de relógio
- Canais com chips coloridos maiores e mais legíveis
- Competição com badge mais visível
- Detalhe da rodada abaixo da competição
- Hover com elevação e glow sutil
- Animação de entrada staggered

**Melhorias no header da seção:**
- Ícone ⚽ maior, título em Bebas Neue tracking largo
- Contador de jogos em badge verde

**Filtro de canais:**
- Pills maiores com ícone/cor do canal
- Scroll horizontal mais fluido

### 3. Sugestões adicionais incluídas
- Adicionar filtro por competição além do filtro por canal (ex: "Brasileirão", "Champions", "Copa do Brasil")
- Separador visual entre grupos com linha gradiente em vez de linha simples

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/Index.tsx` | Remover ContinueWatchingSection |
| `src/components/public/DailyGamesSection.tsx` | Redesign completo |

