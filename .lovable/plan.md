## O que está ruim hoje

| Badge atual | Problema |
|---|---|
| **B.** (Band) | Sigla "B." parece amador; usuário quer "Band" por extenso |
| **REC** (Record) | Mesma coisa; "Record" lê melhor |
| **tnt / SPORTS** | Minúsculo + sub texto fica frágil, sem peso visual |
| **P!** (Premiere) | Errado: cor errada (deve ser verde) e sigla amadora |
| **Apps PNG** | Continuam fora de padrão (PNGs de apps vs badges de canais) |

## Solução: redesenhar TODOS os badges com nome por extenso

Padrão único: **fundo com cor oficial + nome legível com tipografia da marca**. Sem siglas amadoras, sem emojis.

### Canais de TV (12)

| Canal | Label | Fundo | Texto |
|---|---|---|---|
| ESPN | `ESPN` | vermelho `#D9232E` | branco itálico black |
| SporTV | `sporTV` | gradient verde `#00B04F→#007A35` | branco itálico black |
| Globo | `globo` | preto `#0A0A0A` | branco bold com kerning apertado |
| **Premiere** | `PREMIERE` | **gradient verde `#00A859→#007A3D` (verde padrão do canal)** | **branco bold serifa-ish** |
| TNT Sports | `TNT` em cima + `SPORTS` em baixo | preto `#000` | TNT amarelo `#FFD200` BIG, SPORTS branco menor |
| Band | `Band` | gradient azul `#0050B3→#003A82` | branco bold com ponto vermelho |
| CazéTV | `Cazé` | gradient lima `#BEF264→#84CC16` | preto black itálico |
| Record | `RECORD` | gradient azul `#0073CF→#004A8A` | branco bold |
| Canal GOAT | `GOAT` | gradient âmbar `#FBBF24→#D97706` | preto black |
| Space | `SPACE` | gradient cosmos `#3A3A8C→#0A0A2E` | branco com pontinhos estrela |
| DAZN | `DAZN` | branco `#F8F8F8` | preto black itálico |
| YouTube | `YouTube` | branco | "You" preto + "Tube" em pill vermelho `#FF0000` |

### Apps de streaming (8) — convertidos para badge

| App | Label | Fundo | Texto |
|---|---|---|---|
| Netflix | `NETFLIX` | preto `#000` | vermelho `#E50914` condensed bold |
| Prime Video | `prime` + `video` | preto `#0F1111` | branco itálico, "video" em azul `#00A8E1` |
| Disney+ | `Disney+` | gradient azul `#113CCF→#061A4C` | branco script-bold |
| HBO Max | `HBO` em cima + `MAX` embaixo | preto `#000` | branco bold |
| Globoplay | `globoplay` | preto | branco com ponto vermelho |
| Paramount+ | `Paramount+` | gradient azul `#0066FF→#003D99` | branco bold |
| Apple TV+ | `tv+` | preto `#000` | branco com  Apple |
| Starz | `STARZ` | preto `#000` | branco bold com kerning largo |

## Mudanças em `src/pages/Assinar.tsx`

1. Remover imports dos 8 PNGs (linhas 8-15).
2. Unificar `STREAMING_APPS` no mesmo shape de `ChannelTileItem` (sem `icon`, com `label/bg/fg/size/weight/sub`).
3. Reescrever `DEFAULT_TV_CHANNELS` com os labels acima — **Premiere agora em verde padrão do canal**.
4. Simplificar `buildMarqueeItems` — remover discriminator `app` vs `channel`, tudo é badge igual. Apps ganham só um pontinho verde "live" no topo para diferenciar levemente.
5. Render do marquee: um único caminho de badge, sem `<img>`.
6. Aumentar tamanho do tile mobile de `w-14 h-14` para `w-16 h-16` para acomodar nomes maiores com folga, e em `sm:` ir para `w-[72px]`.

Aprova que eu já implemento tudo?
