## Padronizar logos dos canais via Vite imports (definitivo)

### 1. Importar todas as logos como módulos Vite
Em `ChannelBadge.tsx`, importar PNGs/SVGs de `src/assets/brand-logos/` diretamente. Vite gera hash no nome → cache-busting automático eterno, nunca mais "volta pra antiga".

```ts
import bandLogo from "@/assets/brand-logos/band.png";
import cazetvLogo from "@/assets/brand-logos/cazetv.png";
// ... etc para todos
```

### 2. Remover fallback automático para favicons
Hoje quando o local falha, busca favicon do Google (logo antiga da Band veio dali). Nova cadeia: `localLogo → emoji`. Determinístico.

### 3. Garantir localLogo para todos os canais mapeados
Adicionar imports e `localLogo` para: Disney+, Netflix, Prime Video, Max/HBO, Apple TV, Globoplay, Paramount+, SporTV, Space, YouTube, ESPN, TNT Sports, Premiere, Record, GOAT, DAZN, Globo, Band, CazéTV, X Sports.

Para canais sem PNG bom (SBT, NSports, Combate, Benja, OneFootball, RedeTV, NBA, TV Aratu, TV Jornal, Bandsports, Bandplay, Esporte na Band, GE TV) → mantém só emoji (sem favicon externo).

### 4. Wrapper retangular maior e mais profissional
- `sm`: `h-5 w-7` (era `h-5 w-5`)
- `md`: `h-6 w-9` (era `h-6 w-6`)
- `lg`: `h-8 w-12` (era `h-7 w-7`)
- Padding interno reduzido: `p-[2px]`
- `object-contain` mantido — sem distorção

### 5. Logo da Band correta
Usar `src/assets/brand-logos/band.png` (versão nova já enviada). Vite gera hash, não precisa renomear nada.

### Arquivos editados
- `src/components/public/ChannelBadge.tsx` — imports Vite, novo wrapper, sem fallback de favicon
- (opcional cleanup) — `public/channels/*.png` deixam de ser referenciados; podem ficar ou ser removidos depois

### Sugestão extra
Após esta refatoração: para trocar qualquer logo no futuro, basta substituir o arquivo em `src/assets/brand-logos/` — o Vite gera novo hash, todos os clients pegam a nova versão automaticamente, sem PWA cache, sem renome manual.