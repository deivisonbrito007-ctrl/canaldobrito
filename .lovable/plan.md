

# Melhorar Ícones dos Canais de Transmissão

## Situação Atual
Os canais aparecem como simples badges de texto (`text-[9px]`) sem diferenciação visual significativa. Na `DailyGamesSection` já existe um mapa de cores por canal (`CHANNEL_COLORS`), mas na `LiveNowSection` todos usam o mesmo estilo cinza.

Canais encontrados no banco: ESPN, ESPN 4, Sportv, Sportv 2, Sportv 3, Globo, Premiere, Disney+, CazéTV, TNT, Prime Video, Band.com.br, Bandplay, BandSports, Canal GOAT, HBO Max, Record, Space, ge tv, Esporte na Band (YouTube).

## Plano

### 1. Criar componente `ChannelBadge` reutilizável
- Novo arquivo `src/components/public/ChannelBadge.tsx`
- Mapa de **emojis/ícones** + **cores de marca** para cada canal:

| Canal | Cor | Ícone sugerido |
|-------|-----|----------------|
| ESPN | Vermelho | 📺 |
| Sportv (1/2/3) | Verde esmeralda | ⚽ |
| Globo | Branco/preto | 🌐 |
| Premiere | Amarelo | ⭐ |
| Disney+ | Azul escuro | ✨ |
| CazéTV | Lima/verde | 🎮 |
| TNT | Azul | 💥 |
| Prime Video | Azul claro | ▶️ |
| Band / BandSports | Verde | 📡 |
| HBO Max / Max | Roxo | 🎬 |
| Record | Azul | 📺 |
| Canal GOAT | Dourado | 🐐 |
| ge tv | Laranja | 📱 |

- Badge com: ícone pequeno à esquerda + nome do canal, fundo colorido com opacidade, borda sutil, `rounded-lg`, tamanho compacto
- Fallback genérico para canais não mapeados

### 2. Aplicar em `LiveNowSection`
- Substituir os `<span>` genéricos pela nova `ChannelBadge`
- Manter layout `flex-wrap gap-1.5 justify-center`

### 3. Aplicar em `DailyGamesSection`
- Substituir o bloco de channels inline pelo componente `ChannelBadge`
- Remover o mapa `CHANNEL_COLORS` duplicado (movido para o componente)

### 4. Adicionar "Canal do Brito" como canal especial
- Cor vermelha/dourada com destaque especial (borda brilhante ou gradiente)
- Usar o logo do Canal do Brito já disponível em `/public/canal_do_brito_logo.png` como `<img>` no badge

## Resultado
Badges coloridos e visualmente distintos por canal, com ícones para identificação rápida — consistentes entre as seções Ao Vivo e Programação.

