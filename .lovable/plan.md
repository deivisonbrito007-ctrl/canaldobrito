## Objetivo

Na seção **Streaming & TV ao Vivo** da página `/assine-ja`, os apps de streaming (Netflix, Prime, Disney+, HBO Max, Globoplay, Paramount+) já usam logos oficiais — mas os **canais de TV** (ESPN, SporTV, Globo, Premiere, TNT, Band, CazéTV, Record, GOAT, Space) ainda aparecem como **emojis genéricos** dentro de quadrados coloridos. Isso quebra a consistência visual e parece amador. Vamos padronizar tudo com logos oficiais e dar um polimento profissional na página inteira.

---

## Mudanças

### 1. Ícones oficiais para canais de TV (`src/pages/Assinar.tsx`)

Substituir o array `TV_CHANNELS` para incluir `domain` (favicon CDN) e `localLogo` (SVGs já presentes em `public/channels/`), reaproveitando exatamente a mesma cadeia de fallback do `ChannelBadge`:

`localLogo → Google Favicons → DuckDuckGo → emoji`

Logos já disponíveis localmente: `espn.svg`, `premiere.svg`, `cazetv.svg`, `goat.svg`, `dazn.svg`, `youtube.svg`. Os demais (SporTV, Globo, TNT, Band, Record, Space) entram via Google Favicons na resolução 64px.

### 2. Componente unificado de tile no carrossel

Criar um pequeno helper `ChannelTile` dentro de `Assinar.tsx` que renderiza app **e** canal com a mesma estrutura visual: card 56–64px arredondado, logo centralizado em fundo branco translúcido (para canais cujos logos coloridos contrastam mal com o tema dark), label embaixo. Resultado: o carrossel deixa de ter "duas estéticas" (PNG vs emoji).

### 3. Acréscimos sugeridos para profissionalizar a página

- **Adicionar 2 canais relevantes ao showcase**: DAZN e YouTube (já temos os SVGs). Ficam 8 streamings + 12 canais.
- **Trust badges**: trocar a linha "Atualizado diariamente · Full HD & 4K · Multi-telas" para um grid mais robusto com bordas sutis em vez de só ícone+texto solto.
- **Social Proof**: o card "5.000+ Canais" duplica o "5.000+ Clientes" — trocar para algo como "+10 mil títulos" ou "Suporte 24h" para evitar repetição percebida.
- **Headline da seção**: hoje é "Streaming & TV ao Vivo" com bolinha vermelha pulsante. Adicionar pequeno subtítulo (`Tudo em um só lugar`) abaixo para hierarquia tipográfica.
- **Acessibilidade**: incluir `aria-label` no carrossel marquee e `prefers-reduced-motion: reduce` para parar a animação automaticamente.
- **Performance**: adicionar `width`/`height` em todos os `<img>` e `decoding="async"` (alguns já têm).

### 4. Refinamentos visuais gerais (opcionais nesta passada)

- Espaçamento vertical entre seções: hoje várias usam `space-y-*` herdado; padronizar para `py-6 sm:py-8`.
- O countdown "Expira hoje à meia-noite" gera urgência falsa (reseta todo dia). Sugiro remover ou trocar para uma promoção real com data fixa controlada por config.
- O bloco de **planos** repete o nome "Brito Solutions · TV Completa" e tem só 1 plano — caso seja proposital (single plan), reforçar ainda mais o CTA WhatsApp e mostrar o **preço final por dia** (R$ 1,17/dia) como ancoragem.

---

## Arquivos afetados

- `src/pages/Assinar.tsx` — array `TV_CHANNELS`, render do carrossel, helper `ChannelTile`, ajustes de cópia e acessibilidade.

## Detalhes técnicos

```text
TV_CHANNELS[] agora tem { name, domain, localLogo?, bg, text, border, emoji }
ChannelTile reutiliza a lógica de fallback do ChannelBadge (stage 0..3)
Marquee: aria-label="Plataformas e canais inclusos"
                respeita @media (prefers-reduced-motion: reduce) → animação pausa
```

Sem mudanças de banco, sem novas dependências, sem migrações.
