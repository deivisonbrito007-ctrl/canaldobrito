## Links curtos por aba (sem cauda de UTM)

Hoje o link copiado fica longo e feio:
```
https://canaldobrito.site/ao-vivo?utm_source=whatsapp&utm_medium=status&utm_campaign=share-ao-vivo
```

A proposta é deixar **apenas o nome da aba no path**, mantendo rastreio:
```
https://canaldobrito.site/s/ao-vivo
https://canaldobrito.site/s/programacao
https://canaldobrito.site/s/novidades
https://canaldobrito.site/s/sugestoes
```

A rota `/s/<slug>` é um **redirecionador interno** que injeta os UTMs em memória, dispara `landing_with_utm` e em seguida navega para `/<slug>` limpa. O usuário vê uma URL bonita, e o Analytics continua medindo CTR/Conversão exatamente como hoje.

### Por que essa abordagem

- Nenhuma dependência externa (sem encurtador de terceiros)
- Mantém o domínio `canaldobrito.site` (confiança no WhatsApp)
- Não quebra nada: a rota `/<slug>` antiga continua funcionando (alguém clicar num link antigo ainda cai certo)
- Rastreio igual ao atual: o `landing_with_utm` é disparado com `utm_source=whatsapp`, `utm_medium=status`, `utm_campaign=share-<slug>` — só que vindo da rota `/s/<slug>` em vez do query string

### O que muda no código

**1) Nova rota `/s/:slug` em `src/App.tsx`** (ou onde estão as rotas)
- Componente `ShareRedirect` que:
  - Lê `slug`, valida via `SLUG_TO_TAB`
  - Salva attribution sintética em `sessionStorage` (mesma forma do `captureLandingAttribution`) com `utm_source=whatsapp`, `utm_medium=status`, `utm_campaign=share-<slug>`
  - Dispara `track("landing_with_utm", …)` antes do redirect
  - `<Navigate to="/<slug>" replace />` para deixar a URL final limpa
- Slug inválido → `<Navigate to="/" replace />`

**2) `buildDeepLink` (em `src/lib/utils.ts`) ganha modo "short"**
```ts
export function buildDeepLink(base, tab, opts = {}) {
  // novo: opts.short === true → retorna `${base}/s/${TAB_SLUGS[tab]}`
  // sem query string, sem UTMs visíveis
}
```
Comportamento atual com `opts.utm` continua funcionando (compatibilidade), mas o painel passa a usar `short: true` por padrão.

**3) `src/pages/admin/AdminWhatsApp.tsx`**
- Onde hoje chama `buildDeepLink(siteUrl, tab, { utm: withUtm })`, troca para `buildDeepLink(siteUrl, tab, { short: true })`
- Remove o toggle "UTM" (não faz mais sentido — o rastreio é embutido na rota `/s/`)
- Mantém `trackShare(...)` como está, agora com `utm_campaign: \`share-${slug}\`` sempre (consistência)
- Para o link "raiz" do site (`siteUrl` sem aba), também oferece versão curta usando `/s/home`

**4) Mensagens do MessageCard e do "Programação do dia"**
- Os links embutidos em texto (`👉 https://...`) usam o mesmo `buildDeepLink(..., { short: true })` — visualmente bem mais leve no WhatsApp Status.

### Visual antes / depois

```
ANTES: 🔴 AO VIVO no Canal do Brito
       https://canaldobrito.site/ao-vivo?utm_source=whatsapp&utm_medium=status&utm_campaign=share-ao-vivo

DEPOIS: 🔴 AO VIVO no Canal do Brito
        https://canaldobrito.site/s/ao-vivo
```

### Compatibilidade & rastreio

- Links antigos com `?utm_*` continuam funcionando (capture já existente)
- Novo formato `/s/<slug>` produz exatamente os mesmos eventos no Analytics (CTR/Conversão sem regressão nas métricas históricas)
- `utm_content` (cards específicos) continua sendo possível como `?c=<id>` opcional na rota curta — fica para uma evolução futura, não bloqueia esta entrega

### Arquivos editados

- `src/lib/utils.ts` — `buildDeepLink` com `opts.short`
- `src/App.tsx` (ou arquivo de rotas) — nova rota `/s/:slug`
- novo `src/pages/ShareRedirect.tsx` — captura attribution e redireciona
- `src/pages/admin/AdminWhatsApp.tsx` — usa modo curto, remove toggle UTM
- (opcional) `src/lib/analytics.ts` — pequena helper `captureSyntheticAttribution(slug)` para reaproveitar a lógica de gravação em sessionStorage

Sem migrações de banco, sem novas dependências.
