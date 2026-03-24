

# Adicionar Logos de Canais + Auto-scroll no Carrossel da Página /assinar

## Mudanças

### 1. Converter carrossel de streaming apps para marquee auto-scroll
Atualmente o carrossel da seção "Streaming & TV ao Vivo" em `Assinar.tsx` usa `overflow-x-auto` (scroll manual). Vamos converter para usar o mesmo sistema `marquee-track` + `marquee-mask` da tela inicial (`CategoryIconsCarousel`):
- Triplicar os items para loop contínuo
- Usar classes `marquee-container`, `marquee-mask`, `marquee-track`
- Pausar no touch, retomar após 2s (mesmo padrão)

### 2. Adicionar logos de canais de TV ao carrossel
Além dos 8 apps de streaming atuais, adicionar os canais de TV que já existem no `ChannelBadge` (ESPN, SporTV, Globo, Premiere, TNT, Band, HBO Max, CazéTV, Record, etc.) como items visuais no mesmo carrossel marquee, usando os emojis e cores do `CHANNEL_MAP`.

### Estrutura do carrossel
Os items serão renderizados como pills/badges com emoji + nome, usando as cores do `CHANNEL_MAP` para canais de TV e os ícones PNG para apps de streaming, todos no mesmo fluxo marquee contínuo.

## Arquivo modificado
- `src/pages/Assinar.tsx` — seção "Streaming & TV ao Vivo": trocar scroll manual por marquee, adicionar canais de TV

