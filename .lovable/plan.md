## Diagnóstico (testado na preview)

| Link | Resultado | Status |
|---|---|---|
| `/s/ao-vivo` | redireciona para `/ao-vivo` → carrega aba "Ao Vivo" | ✅ OK |
| `/s/filmes-e-series` | redireciona para `/filmes-e-series` → **404 "Página não encontrada"** | ❌ BUG |
| `/s/programacao` | redireciona para `/programacao` → carrega aba "Programação" | ✅ OK |

### Causa raiz

- `src/lib/utils.ts` define `TAB_SLUGS.novidades = "filmes-e-series"`.
- `ShareRedirect` redireciona corretamente para `/filmes-e-series`.
- **`src/App.tsx` não tem rota `/filmes-e-series`** — só tem `/novidades`, `/sugestoes`, `/destaques`. O `Index.tsx` até sabe interpretar o slug `filmes-e-series` (está no `SLUG_TO_TAB`), mas o React Router nunca chega lá porque a rota não existe e cai no `<Route path="*" element={<NotFound />} />`.

Mesmo problema potencial para qualquer pessoa que acesse `/filmes-e-series` direto (compartilhado por engano sem o `/s/` prefix, ou colado da barra do navegador).

## O que vou alterar

### 1. Registrar a rota canônica `/filmes-e-series`
Em `src/App.tsx`, adicionar:
```tsx
<Route path="/filmes-e-series" element={<Index />} />
```
junto às outras rotas que apontam para `Index`. Isso resolve o 404 e mantém o slug "bonito" usado no compartilhamento.

### 2. Aliases curtos opcionais
Adicionar também `/filmes` e `/series` apontando para `Index` — já estão no `SLUG_TO_TAB` e podem ser compartilhados manualmente. Custo zero, evita 404s futuros.

### 3. Hardening do `ShareRedirect`
Hoje, se alguém acessa `/s/qualquercoisa` com slug inválido, o `target` cai em `/` silenciosamente. Vou:
- Manter o redirect para `/` como fallback.
- Logar um `console.warn` em dev (não polui prod) para facilitar debug futuro.
- Adicionar um pequeno `<noscript>` no componente caso JS falhe (não bloqueia, só melhora).

### 4. Verificação rápida dos demais slugs
Conferir cada entrada de `SLUG_TO_TAB` contra as rotas em `App.tsx`. Hoje:
- ✅ `ao-vivo`, `live`, `home` → `/ao-vivo` existe
- ❌ `filmes-e-series`, `filmes`, `series`, `novidades`, `sugestoes`, `destaques`, `highlights` → só `/novidades`, `/sugestoes`, `/destaques` existem; faltam os 4 primeiros
- ✅ `programacao`, `schedule` → `/programacao` existe (`schedule` não tem rota, mas ninguém compartilha esse)

Vou cobrir todas as variações que `TAB_SLUGS` produz, deixando o conjunto de aliases consistente com o `SLUG_TO_TAB`.

## Performance / lentidão (observação)

Os 3 links carregam em <1s na preview após o redirect. Não há lentidão real — apenas o splash padrão "Carregando…" do `index.html` aparece por uma fração de segundo no primeiro acesso (download dos chunks Vite). Em produção/PWA já cacheado é instantâneo.

Se quiser, posso (opcional, não vou implementar sem aprovar):
- Pré-renderizar o splash do `Index` direto no fallback do `ShareRedirect` (em vez do branco) para evitar o "flash" durante o `<Navigate>`.
- Adicionar `<link rel="prefetch">` para os principais chunks de aba no `index.html`.

## Sugestões adicionais (não implemento sem aprovar)

- **Encurtador unificado**: hoje o app tem 2 padrões — `/ao-vivo` (canônico) e `/s/ao-vivo` (com tracking). Padronizar tudo para `/s/` no botão "Compartilhar" garantindo que todo link pago/orgânico seja rastreado por UTM.
- **Slug com hash de origem** opcional: `/s/filmes-e-series/wpp-status-12` para A/B test de copy no WhatsApp.
- **Open Graph dinâmico por aba**: cada slug poderia ter `og:title`/`og:image` próprios para preview mais rico no WhatsApp/Twitter.

## Arquivos a editar

- `src/App.tsx` — adicionar `/filmes-e-series`, `/filmes`, `/series` apontando para `Index`.
- `src/pages/ShareRedirect.tsx` — `console.warn` em dev para slug desconhecido.

## Não muda

- Lógica de `Index.tsx` (já entende todos os slugs).
- `SLUG_TO_TAB` / `TAB_SLUGS` (estão corretos).
- Auth / RLS / banco / SEO.
