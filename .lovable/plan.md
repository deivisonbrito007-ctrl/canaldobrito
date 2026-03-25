

## Auditoria: Notificações Push — Problemas Encontrados e Correções

### Problemas Identificados

**1. Conflito de Service Workers (CRÍTICO)**
O `sw-custom.js` é registrado com `scope: "/"`, mas o `vite-plugin-pwa` também gera um SW com o mesmo scope. Apenas UM service worker pode controlar um scope — o segundo registro pode sobrescrever o primeiro, fazendo com que o push listener **ou** o cache offline pare de funcionar.

**2. Race condition no `game_ids` (MÉDIO)**
Quando o cron dispara e encontra múltiplos jogos para a mesma subscription, ele faz `array_remove` sequencialmente, mas cada iteração lê o array antigo e sobrescreve. Isso pode re-adicionar IDs já removidos.

**3. Limite de 1000 rows na query de subscriptions (MÉDIO)**
A query `push_subscriptions.overlaps(game_ids, gameIds)` usa o limite padrão de 1000 rows. Se houver mais de 1000 inscritos num jogo popular, alguns não receberão notificação.

**4. Timeout da Edge Function (MÉDIO)**
O envio é sequencial — para cada subscription, faz crypto + HTTP request. Com centenas de subs, pode exceder o timeout de 60s da edge function.

**5. Subscription keys desatualizadas (BAIXO)**
Se o browser regenerar as chaves (reinstalação do PWA, limpeza de dados), o upsert por endpoint atualiza `p256dh`/`auth`, mas se o usuário não clicar no 🔔 novamente, os dados antigos ficam no DB e o push falha silenciosamente.

### Plano de Correções

**Etapa 1: Unificar Service Workers**
- Migrar o `vite-plugin-pwa` para `injectManifest` strategy no `vite.config.ts`
- Criar `src/sw.ts` que importa o precache do workbox E adiciona os listeners de push/notificationclick
- Remover `public/sw-custom.js`
- Atualizar `usePushSubscription` para usar `navigator.serviceWorker.ready` em vez de registrar manualmente

**Etapa 2: Corrigir race condition nos game_ids**
- Alterar a edge function para remover TODOS os game_ids notificados de uma vez com uma única query SQL usando `array_remove` encadeado, em vez de um update por jogo
- Usar uma function SQL `remove_multiple_game_ids(_endpoint, _ids text[])` para atomicidade

**Etapa 3: Paginar subscriptions**
- Na edge function, buscar subscriptions em lotes de 500 usando `.range(offset, offset+499)` em loop até não haver mais resultados

**Etapa 4: Paralelizar envio**
- Usar `Promise.allSettled()` para enviar em lotes de 10 notificações simultaneamente em vez de sequencialmente
- Isso reduz o tempo de execução ~10x

**Etapa 5: Atualizar keys no subscribe**
- No hook, ao detectar subscription existente no browser, sempre fazer upsert das keys no DB (já faz isso no `subscribe()`, mas não no `useEffect` de mount)
- No mount, se encontrar subscription existente, re-sincronizar keys no DB

### Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `vite.config.ts` | Mudar PWA para `injectManifest` |
| `src/sw.ts` | Novo — SW unificado com precache + push |
| `public/sw-custom.js` | Remover |
| `src/hooks/usePushSubscription.ts` | Remover registro manual, re-sync keys no mount |
| `supabase/functions/send-push-notifications/index.ts` | Paginação, envio paralelo, batch remove |
| Migration SQL | Nova function `remove_multiple_game_ids` |

### Detalhes Técnicos

```text
Antes (2 SWs conflitantes):
  vite-plugin-pwa → sw.js (scope /)  ← controla cache
  sw-custom.js (scope /)              ← controla push
  ⚠️ Apenas 1 vence — push pode não funcionar

Depois (1 SW unificado):
  vite-plugin-pwa (injectManifest) → sw.ts (scope /)
    ├── precache (workbox)
    └── push + notificationclick listeners
```

