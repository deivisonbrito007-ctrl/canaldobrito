## Causa raiz confirmada

O código já está correto. As rotas `/filmes-e-series`, `/filmes` e `/series` foram adicionadas em `src/App.tsx` (linhas 47-49) na rodada anterior e funcionam **na preview do sandbox**.

Porém:
- `https://agendabritosolutions.lovable.app/filmes-e-series` → **404**
- `https://canaldobrito.site/s/filmes-e-series` → redireciona para `/filmes-e-series` → **404**

Isso significa que **o build publicado em produção ainda é a versão anterior** (sem as rotas novas). O domínio customizado serve o mesmo bundle do `agendabritosolutions.lovable.app`, então o problema se propaga.

**O código não precisa de alteração para corrigir o 404 — precisa apenas ser republicado.**

## O que fazer

### 1. Republicar o app (ação manual sua)
Clicar no botão **Publish** no topo direito do editor Lovable. Isso vai fazer o build atual (que já tem as rotas) virar a versão de produção. Em ~30 segundos os 3 links passam a funcionar tanto em `agendabritosolutions.lovable.app` quanto em `canaldobrito.site`.

### 2. Hardening adicional do `ShareRedirect` (faço no código)
Hoje, se um slug desconhecido chegar via `/s/xxx`, o redirect cai em `/` silenciosamente. Vou:
- Disparar um evento de analytics `landing_with_unknown_slug` (em prod também, não só dev) para sabermos se alguém está compartilhando link quebrado.
- Manter o fallback para `/` (comportamento certo).

### 3. Reforço para evitar 404 futuro em rotas "limpas"
Vou adicionar um **catch-all inteligente** antes do `<Route path="*" element={<NotFound />} />`: se o path da URL for um slug conhecido em `SLUG_TO_TAB` (ex: alguém digita `/highlights` ou `/movies`), redirecionamos para a aba certa em vez de mostrar 404.

```tsx
// Novo componente SlugFallback.tsx
const slug = location.pathname.replace(/^\//, "").toLowerCase();
const tab = SLUG_TO_TAB[slug];
if (tab) return <Navigate to={`/${TAB_SLUGS[tab]}`} replace />;
return <NotFound />;
```

Aplicado em `App.tsx`:
```tsx
<Route path="*" element={<SlugFallback />} />
```

Isso garante que **qualquer slug listado em `SLUG_TO_TAB`** funciona como rota direta, sem precisar registrar uma `<Route>` para cada um. À prova de futuro.

### 4. Verificação final pós-publicação
Depois que você publicar, eu testo os 3 links no domínio real e confirmo:
- `https://canaldobrito.site/s/ao-vivo`
- `https://canaldobrito.site/s/filmes-e-series`
- `https://canaldobrito.site/s/programacao`

## Arquivos a editar

- `src/components/SlugFallback.tsx` — novo, redireciona slugs conhecidos antes do 404.
- `src/App.tsx` — usar `SlugFallback` no path `*`.
- `src/pages/ShareRedirect.tsx` — track event de slug desconhecido.

## Sugestões opcionais (não implemento sem aprovar)

- **Open Graph dinâmico por slug**: cada link compartilhado no WhatsApp poderia mostrar título/imagem específicos da aba (ex: "Filmes e Séries no Canal do Brito" com poster) em vez do OG genérico do site.
- **Auto-publish em PRs aprovados**: configurar GitHub Action para republicar automaticamente quando código vai pra `main`, evitando o esquecimento de clicar em Publish.
- **Healthcheck dos share links**: cron diário que faz `HEAD` em cada `/s/<slug>` e alerta no admin se alguma retornar ≠ 200.

## O que NÃO muda
Lógica do `Index.tsx`, `SLUG_TO_TAB`, `TAB_SLUGS`, auth, banco, RLS.
