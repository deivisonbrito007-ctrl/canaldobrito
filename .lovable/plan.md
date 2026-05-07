## Problema

Quando uma logo é trocada (ex.: CazéTV via upload personalizado, ou trocando o asset built-in), os usuários continuam vendo a versão antiga porque:

- **Logos personalizadas (`custom_logo_url`)**: a URL pública do Supabase Storage não muda quando o arquivo é substituído, e o browser/CDN serve a versão em cache (`cacheControl: "3600"`).
- **Logos built-in importadas (`@/assets/brand-logos/*.png|svg`)**: já recebem hash via Vite no build, então só "ficam velhas" quando o service worker entrega bundle antigo — esse caso já é coberto por `useVersionCheck`. O ponto fraco real é o `custom_logo_url`.

Hoje cada upload novo gera path único (`slug-Date.now().ext`), o que ajuda apenas uploads NOVOS. Quem já tinha logo personalizada continua com URL antiga sem busting; e quando alguém substitui via outro caminho, o browser cacheia.

## Solução

Versionar a URL exibida pela `ChannelBadge` adicionando um query param `?v=<stamp>` derivado do registro do banco. O stamp vem de `channel_logo_mappings.updated_at` — sempre que o admin salva (incluindo trocar a logo), o timestamp muda → URL muda → browser invalida cache automaticamente.

Para built-ins, mantém o hash do Vite (já funciona) e adicionalmente um stamp global de build, garantindo que após cada deploy o `<img>` reidrate com URL nova mesmo se cache do navegador for agressivo.

### Mudanças

1. **`src/hooks/useChannelMappings.ts`**
   - Adicionar `updated_at?: string | null` ao tipo `ChannelMapping`.
   - Já vem do `select("*")`; sem mudança de query.

2. **`src/lib/cacheBust.ts`** (novo)
   - Helper `withCacheBust(url, stamp)`:
     - Se `url` é falsy → retorna `url`.
     - Se `url` já é blob/data → retorna intacto.
     - Converte `stamp` (ISO ou número) em hash curto (ex.: `Date.parse(stamp).toString(36)`).
     - Acrescenta `?v=...` ou `&v=...` conforme tiver query.

3. **`src/components/public/ChannelBadge.tsx`**
   - Em `ChannelIcon`, derivar `src` final:
     - Para `customUrl`: `withCacheBust(customUrl, override.updated_at)`.
     - Para registry built-in: `withCacheBust(registryEntry.src, __APP_VERSION__)` (build stamp já existente em `vite.config.ts`).
   - Passar `override.updated_at` para `ChannelIcon` via prop nova `version`.

4. **`src/components/admin/ChannelLogoUpload.tsx`**
   - Trocar `cacheControl: "3600"` por `cacheControl: "60"` no upload — mesmo com cache-bust por query, isso reduz janela em CDNs que ignoram query string.
   - Manter o path único `slug-Date.now().ext` (continua útil como fallback).

5. **`src/pages/admin/AdminCanaisLogos.tsx`**
   - Após salvar (mutation `upsert`/`onSuccess`), além de invalidar `CHANNEL_MAPPINGS_QK`, também invalidar com `refetchType: "active"` para forçar re-render imediato dos badges em uso.
   - Se `custom_logo_url` mudou, fazer `URL.createObjectURL` preview opcional para feedback instantâneo no modal (nice-to-have, sem custo extra).

6. **`src/pages/admin/AdminConfiguracoes.tsx`** (referência ao `cazetv-v2.png`)
   - Sem mudança de código — apenas confirmar que o asset estático em `public/channels/cazetv-v2.png` segue versionado por nome (`-v2`) caso exista. Se for referenciado em algum `<img>` direto, aplicar `withCacheBust(path, __APP_VERSION__)`.

### Como o cache-bust funciona

```text
Antes:  https://...supabase.../channel-logos/cazetv-1714.png
        → CDN devolve cópia em cache, não nota substituição

Depois: https://...supabase.../channel-logos/cazetv-1714.png?v=1abx5y
                                                              ^^^^^^
                                                              hash de updated_at

        Admin troca a logo / salva → updated_at muda
        → ?v=novohash → URL nova → fetch novo, sem refresh manual
```

### Arquivos alterados

- `src/lib/cacheBust.ts` (novo, ~15 linhas)
- `src/hooks/useChannelMappings.ts` (1 campo no tipo)
- `src/components/public/ChannelBadge.tsx` (aplicar `withCacheBust` no `<img>`)
- `src/components/admin/ChannelLogoUpload.tsx` (cacheControl "60")
- `src/pages/admin/AdminCanaisLogos.tsx` (invalidate com `refetchType: "active"`)
- `src/lib/__tests__/cacheBust.test.ts` (novo, 4–5 casos: url vazia, sem query, com query, blob/data, stamp falsy)

### Observações

- Não exige migração de banco — `updated_at` já existe em `channel_logo_mappings` e dispara via trigger `update_updated_at_column`.
- Compatível com PWA: o service worker faz cache por URL exata; mudar query invalida automaticamente a entrada antiga.
- Sem impacto em performance: o stamp é computado no render (custo desprezível) e o React Query já cacheia o map de overrides por 5 min.

Posso seguir com a implementação?
