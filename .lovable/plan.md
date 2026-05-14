## Refatoração completa da aba AO VIVO (`/ao-vivo`)

Reescrita do `src/components/public/LivePageContent.tsx` com foco mobile-first, hierarquia clara, visual minimalista premium e zero dado falso.

### Princípios

- **Menos é mais**: remover sticky hero ruidoso, aviso amarelo grande, faixas vermelhas em gradiente, watermarks de emoji a 88px, anéis pulsantes em borda inteira de card e múltiplos "selos" de cabeçalho.
- **Conteúdo primeiro**: time A · minuto · time B · canal — nessa ordem, com tipografia grande.
- **Acentos pontuais**: vermelho live e verde primário aparecem só nos pontos certos (dot, hover, CTA inferior), nunca cobrindo grandes superfícies.
- **Sem CTA no hero**: a maioria dos usuários da aba já é assinante — botão "Assistir agora" sai. CTA de assinatura fica só no rodapé do feed, discreto.
- **Sem dado fake**: sem placar, sem viewers.

---

### Estrutura final

```text
┌────────────────────────────────────────┐
│ ● AO VIVO  ·  7 jogos agora     12:34  │  ← header inline compacto
├────────────────────────────────────────┤
│  ⚽ FUTEBOL · BRASILEIRÃO              │
│                                        │
│       FLAMENGO   —   PALMEIRAS         │  ← HERO (1º live), sem CTA
│              · 67' ao vivo ·            │
│  📺 SporTV   Premiere   +1             │
├────────────────────────────────────────┤
│  Todos · 7   ⚽ 4   🏀 2   🥊 1        │  ← filtros uma linha, sem glow
├────────────────────────────────────────┤
│  ⚽ Brasileirão              SporTV    │
│  Botafogo        67'        Vasco      │  ← rows magras
│  ───────────────────────────────────── │
│  🏀 NBA                       ESPN     │
│  Lakers          Q3 8:42    Celtics    │
│  ...                                   │
├────────────────────────────────────────┤
│  Em breve · próximo em 14min           │
│  20:30  Real × Atlético       SporTV   │
│  21:00  Bayern × Dortmund     ESPN     │
├────────────────────────────────────────┤
│  Ainda não é assinante?                │
│  Assista a tudo por R$ 35/mês          │  ← CTA único de assinatura,
│       [ ASSINAR AGORA ]                │     no rodapé, discreto
└────────────────────────────────────────┘
```

---

### Componentes (todos locais em `LivePageContent.tsx`)

1. **`LiveHeader`** — Linha única, sem sticky pesado:
   - Esquerda: dot vermelho (ping discreto) + `AO VIVO` (Bebas Neue) + `· 7 jogos`.
   - Direita: relógio `tabular-nums` em cinza.
   - Sem borda, sem gradiente, padding generoso.

2. **`LiveHeroCard`** (1º jogo da lista filtrada):
   - Card grande, fundo `#0D0D0D` puro.
   - Glow MUITO sutil: `box-shadow` vermelho a 8% opacidade. Sem borda colorida.
   - Acento do esporte: barra vertical de 2px à esquerda na cor do esporte.
   - Topo: `⚽ FUTEBOL · BRASILEIRÃO` (10px, uppercase, cinza).
   - Times: `text-[28px]` Bebas, brancos, com `—` no meio (adversariais) ou nome único centralizado (eventos MMA/F1/etc).
   - Minuto: `· 67' ao vivo ·` em vermelho 13px abaixo dos times.
   - Canais: até 3 `ChannelBadge`.
   - **Sem botão "Assistir agora"** (decisão confirmada).
   - Animação: fade-in via framer-motion + pulse só no dot vermelho.

3. **`SportFilterBar`** — Uma linha, scroll-x, chips minimais:
   - "Todos · 7", `⚽ Futebol · 4`, etc. Só esportes presentes em `liveGames`.
   - Ativo: fundo branco/5 + texto verde primário; inativo: cinza secundário sem borda.
   - Sem glow, sem shadow.

4. **`LiveGameRow`** — Substitui o `LiveGameCard` atual:
   - `min-h-[88px]`, fundo `#0D0D0D`, **sem borda**, separador sutil entre rows (`border-b border-white/[0.04]`).
   - Linha 1: `⚽ Brasileirão` (esquerda, 11px cinza) · `📺 SporTV +1` (direita, 11px cinza).
   - Linha 2: `home_team` (16px semibold) · pílula `67'` em vermelho (Bebas 18px) · `away_team` (16px semibold).
   - Eventos não-adversariais: nome único centralizado + minuto à direita.
   - Hover: `bg-white/[0.02]` apenas.
   - Acento por esporte: barra de 2px à esquerda, opacidade 35%.

5. **`UpcomingMiniRow`** — "Em breve" como lista magra (próximos 60min):
   - Linha de 44px: `20:30  Real × Atlético       SporTV`.
   - Sem card, só padding e separador. Header: `Em breve · próximo em 14min`.

6. **`PremiumCTA`** — Único ponto de conversão, no fim do feed:
   - Fundo `#0D0D0D`, glow verde a 12% opacidade.
   - "Ainda não é assinante? Assista a tudo por R$ 35/mês" + emojis discretos.
   - Botão `ASSINAR AGORA` → `/assinar?from=ao-vivo-bottom`.
   - Renderizado sempre que há live ou no empty state.

7. **`EmptyLive`** (refeito): card único, `Radio` em cinza, "Sem jogos ao vivo agora", botão "Ver programação" (mantém `nav-tab-change`).

8. **Aviso amarelo** (`LiveNotice`): **removido** — vira nota de 1 linha em cinza no rodapé, abaixo do CTA premium (texto sobre alterações de programação).

---

### Paleta e tokens

Adições mínimas em `src/index.css`:

- `--live-bg: 0 0% 2%` (`#050505`)
- `--live-card: 0 0% 5%` (`#0D0D0D`)
- `--live-text-muted: 0 0% 63%` (`#A0A0A0`)

Verde `#00FF88` e vermelho `#FF3B3B` já existem como `--primary` e `--destructive`/`--live` — reuso direto, **nada hardcoded** em componentes.

Fundo da aba recebe um `radial-gradient` muito sutil atrás do hero (vermelho a 6% opacidade), profundidade sem poluição.

---

### Comportamento e dados

- **Minuto ao vivo**: `getElapsedMinutes(...)` já existe — reuso 100%.
- **Hero = primeiro live filtrado**, ordenado por: (a) `isHighlightCompetition`, (b) minuto mais avançado, (c) ordem natural.
- **Lista live**: demais jogos exceto o do hero.
- **Em breve**: lógica atual (próximos 60min, máximo 5) — só muda a UI.
- **Tick e realtime**: `useLiveTick` + `useRealtimeDailyGames` mantidos.
- **Sem placar, sem viewers, sem CTA no hero** (decisões confirmadas).

---

### Arquivos tocados

- `src/components/public/LivePageContent.tsx` — reescrita completa (~380 linhas, mais enxuto que as 581 atuais).
- `src/index.css` — 3 variáveis novas + 1 keyframe `live-pulse` se ainda não existir.
- Nenhum arquivo deletado, nenhuma rota nova, nenhuma mudança de schema.

### Fora de escopo

- Placar real ao vivo (precisa backend).
- Push de "começou" (sistema de push existente não muda aqui).
- Migração da página pública `/agenda` (`AgendaPublica.tsx`) para o mesmo padrão — pacote separado.
