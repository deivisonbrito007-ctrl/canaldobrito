## Diagnóstico

Os bugs que você está vendo (logos sumindo após carregar, "globo borrado" repetido em vários canais, layouts feios) têm 3 causas:

1. **Clearbit Logo API foi descontinuado** (dez/2023) → todas as URLs `logo.clearbit.com/...` retornam 404 depois de uns segundos.
2. **Google Favicons devolve 16x16 esticado** → aquele "globinho azul borrado" que aparece em CazéTV, Canal GOAT e Space é o favicon genérico do navegador.
3. **SVGs locais** (`/channels/*.svg`) que tentei desenhar antes ficaram caseiros e inconsistentes.

Não existe CDN público confiável que tenha logo oficial de **todos** esses canais brasileiros (ESPN BR, SporTV, Premiere, Canal GOAT, CazéTV, Space).

## Solução

**Abandonar completamente a busca de imagem externa para canais de TV.** Renderizar cada canal como **badge tipográfico** com:

- Cor de fundo oficial da marca (verde SporTV, vermelho ESPN, preto+amarelo TNT, etc.)
- Sigla/nome curto em fonte bold/black
- Gradientes sutis para dar profundidade

Resultado: zero requisições externas, zero flicker, zero 404, visual consistente e profissional.

Os apps de streaming (Netflix, Prime, Disney+, etc.) **continuam usando os PNGs reais** já em `src/assets/app-icons/` — esses são logos oficiais comprovados.

## Mudanças em `src/pages/Assinar.tsx`

1. Trocar tipo `ChannelTileItem` para badge: `{ name, label, bg, fg, size, weight, italic, sub }`.
2. Reescrever `DEFAULT_TV_CHANNELS` com cores oficiais:
   - **ESPN** → vermelho `#D9232E`, "ESPN" itálico branco
   - **SporTV** → gradient verde `#00B04F → #007A35`, "sporTV" itálico branco
   - **Globo** → preto, "GLOBO"
   - **Premiere** → preto, "P!" dourado `#FFD700`
   - **TNT Sports** → preto, "tnt" amarelo + sub "SPORTS"
   - **Band** → gradient azul `#0050B3 → #003A82`, "B."
   - **CazéTV** → gradient verde-limão `#BEF264 → #84CC16`, "Cazé"
   - **Record** → gradient azul `#0073CF → #004A8A`, "REC"
   - **GOAT** → gradient âmbar `#FBBF24 → #D97706`, "GOAT"
   - **Space** → gradient cosmos `#3A3A8C → #0A0A2E`, "SPACE"
   - **DAZN** → branco `#F8F8F8`, "DAZN" preto itálico
   - **YouTube** → vermelho `#FF0000`, "▶" branco
3. Remover componente `ChannelLogo` (todo o sistema de fallback `localLogo → Clearbit → Google → DuckDuckGo → emoji`).
4. Substituir o render do tile do canal por um único `<div>` com classes do badge, mostrando `label` (e `sub` opcional embaixo).
5. Limpar `useSettings`/`tv_channels` parsing — manter compat se admin já salvou JSON, mas sem campos de logo externo.

## Limpeza opcional (recomendada)

- Deletar `public/channels/*.svg` (não são mais usados em lugar nenhum).
- Remover seção "Canais & Streaming" do `AdminConfiguracoes.tsx` (editor JSON virou irrelevante já que tudo é hardcoded com cor da marca).

Posso aplicar a limpeza junto, ou só a correção principal e mantemos o admin como está. Aprova que eu já implemento?
