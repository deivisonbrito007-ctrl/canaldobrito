

## Notificações Push para Jogos

### Visão Geral
Conectar o sistema de lembretes (🔔) existente ao Web Push API do navegador, para que usuários recebam uma notificação real ~15 minutos antes do início do jogo, mesmo com o app em segundo plano.

### Arquitetura

```text
┌─────────────┐     subscribe      ┌──────────────────┐
│  Browser     │ ──────────────►   │  push_subscribers │  (nova tabela)
│  (SW + Push) │                   │  user_id, endpoint│
└──────┬───────┘                   │  keys, game_ids[] │
       │                           └────────┬─────────┘
       │  push event                        │
       │◄───────────────────────────────────┤
       │                           ┌────────┴─────────┐
       │                           │  Edge Function    │
       │                           │  send-push-notif  │
       │                           │  (cron cada 1min) │
       │                           └──────────────────┘
```

### Etapas

**1. Gerar VAPID Keys e configurar secrets**
- Gerar par de chaves VAPID (público/privado) via edge function utilitária
- Armazenar `VAPID_PUBLIC_KEY` na tabela `settings` (público) e `VAPID_PRIVATE_KEY` como secret da edge function

**2. Criar tabela `push_subscriptions`**
- Colunas: `id`, `endpoint`, `p256dh`, `auth`, `game_ids` (text[]), `created_at`
- RLS: insert/update/delete para qualquer pessoa (anônimo — não requer login), select público

**3. Atualizar o Service Worker**
- Adicionar listener `push` no SW gerado pelo vite-plugin-pwa (via `injectManifest` ou custom SW)
- Exibir notificação nativa com título do jogo, ícone CB e ação "Abrir"

**4. Hook `usePushSubscription`**
- Solicitar permissão de notificação
- Registrar subscription via `PushManager.subscribe()` com VAPID public key
- Salvar/atualizar endpoint + keys na tabela `push_subscriptions`
- Função `addGameReminder(gameId)` que adiciona o ID ao array `game_ids`

**5. Integrar no botão 🔔 existente**
- Ao clicar no 🔔, além do localStorage atual, chamar `addGameReminder` do hook
- Se for a primeira vez, solicitar permissão de notificação com UI explicativa
- Mostrar toast confirmando "Você será notificado 15min antes"

**6. Edge Function `send-push-notifications`**
- Cron job a cada 1 minuto
- Consulta jogos que começam em exatamente 15 minutos (±1min de tolerância)
- Busca subscriptions que têm esses game_ids
- Envia web-push para cada endpoint
- Remove game_ids já notificados para evitar duplicatas

**7. Registrar cron job**
- SQL via pg_cron chamando a edge function a cada minuto

### Detalhes Técnicos

- **VAPID**: Usaremos a lib `web-push` (npm) na edge function para envio
- **Sem login necessário**: Subscriptions são anônimas, vinculadas ao dispositivo
- **iOS Safari**: Web Push é suportado desde iOS 16.4 em PWAs instaladas — funciona com nosso setup standalone
- **Fallback**: O localStorage reminder existente continua funcionando como fallback visual (badge pulsante "Começa em X min")
- **Limpeza**: game_ids de datas passadas são removidos automaticamente pela edge function

### Arquivos Afetados
- `src/hooks/usePushSubscription.ts` — novo hook
- `src/components/public/DailyGamesSection.tsx` — integrar push no botão 🔔
- `supabase/functions/send-push-notifications/index.ts` — nova edge function
- `vite.config.ts` — configurar custom SW ou injectManifest para push listener
- Migration SQL — nova tabela `push_subscriptions`
- SQL insert — cron job pg_cron

