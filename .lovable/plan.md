## Objetivo
Trocar os emojis genéricos dos badges de canais (📺, ⚽, ▶️) pelos **logos/favicons oficiais** dos canais, com fallback elegante.

## Estratégia escolhida
**DuckDuckGo Icons CDN** (`https://icons.duckduckgo.com/ip3/{dominio}.ico`)
- Gratuito, sem chave de API, sem rate limit relevante
- Retorna o favicon oficial de qualquer site (32x32, sempre atualizado)
- Funciona para todos os canais BR e internacionais (basta o domínio)
- Carregamento `lazy` + `decoding async` (sem impacto em performance)

## Mudanças

**Arquivo único: `src/components/public/ChannelBadge.tsx`**

1. Adicionar campo `domain` no `ChannelConfig` mapeando cada canal para seu site oficial:
   - ESPN → `espn.com.br`
   - SporTV → `sportv.globo.com`
   - Premiere → `premiere.globo.com`
   - Globo → `globo.com`
   - ge tv → `ge.globo.com`
   - Disney+ → `disneyplus.com`
   - HBO Max → `max.com`
   - Prime Video → `primevideo.com`
   - DAZN → `dazn.com`
   - TNT Sports → `tntsports.com.br`
   - Band → `band.uol.com.br`
   - Record → `recordtv.r7.com`
   - YouTube / Cazé TV / Canal GOAT / Esporte na Band → `youtube.com`

2. Criar componente interno `ChannelIcon`:
   - Tenta carregar `<img src="https://icons.duckduckgo.com/ip3/{domain}.ico">`
   - Em `onError` (sem rede / domínio inválido) → degrada para o emoji original
   - Mantém tamanho proporcional ao `size` do badge (sm/md/lg)

3. Manter intactos:
   - Gradientes, bordas e glows coloridos atuais
   - Tratamento especial do **Canal do Brito** (já usa `/canal_do_brito_logo.png` local)
   - Lógica de nome curto em mobile (Prime, HBO, YT, etc.)
   - Animação `hover:scale-105 hover:brightness-110`

## Resultado visual

```
Antes:  [📺 ESPN]   [⭐ Premiere]   [▶️ YouTube]
Depois: [🔴 ESPN]   [⭐ Premiere]   [▶️ YouTube]
         ↑logo       ↑logo           ↑logo
         oficial     oficial         oficial
```

## Riscos / mitigações

- **Rede offline**: `onError` cai pro emoji → nunca quebra
- **Domínio inválido**: idem fallback emoji
- **CORS**: DDG Icons CDN serve com headers permissivos para `<img>`
- **Performance**: imagens 32×32 (~1KB cada), `lazy + async`, cacheadas pelo browser/SW
- **PWA offline**: primeira visita carrega; depois fica em cache. Sem rede + sem cache = emoji