## Objetivo

1. Trocar os links longos com `?utm_*` do Laboratório A/B por **links curtos** (`/s/<slug>?c=<tag>`), iguais aos demais links da aba.
2. Garantir que **cada acesso** seja contabilizado por template+variante (e também pelos links rápidos e templates prontos existentes).
3. Mostrar acessos por link diretamente na UI do admin.

## Mudanças

### 1. `src/lib/utils.ts` — `buildDeepLink`
- Aceitar `opts.content` mesmo quando `short: true`.
- Formato resultante: `https://canaldobrito.site/s/ao-vivo?c=ab-jogos-a` (ou `tpl-geral`, `quick-live`, etc.).
- Mantém retrocompatibilidade: sem `content`, retorna `/s/<slug>` puro.

### 2. `src/pages/ShareRedirect.tsx`
- Ler `?c=` da query string.
- Incluir no payload de `landing_with_utm`: `utm_content = c`.
- Sanitizar (regex `^[a-z0-9-]{1,80}$`) e descartar valores inválidos.
- Redirect preserva o `?c=` no destino apenas para debugging interno (opcional — por padrão limpo).

### 3. `src/components/admin/whatsapp/ABTemplateLab.tsx`
- Construir links via `buildDeepLink(siteUrl, t.tab, { short: true, content: abUtmContent(t.id, v) })`.
- Remover concatenação manual de `?utm_content=`.
- Resultado: `…/s/<slug>?c=ab-<id>-<a|b>` — curto, legível.

### 4. `src/pages/admin/AdminWhatsApp.tsx` — Links rápidos + Textos prontos
- **Links rápidos por aba**: passar `content: "quick-<tab>"`.
- **Textos prontos (MessageCard)**: passar `content: "tpl-<id>"`.
- **Mensagem personalizada**: passar `content: "custom-<linkTab>"`.
- Cada um vira: `…/s/programacao?c=quick-schedule`, `…/s/ao-vivo?c=tpl-aovivo`, etc.

### 5. Contadores de acesso na UI

Novo hook `useShareLandingCounts(contents: string[], windowDays)`:
- Consulta `analytics_events` filtrando `event = 'landing_with_utm'`, `utm_content IN (...)`, `created_at >= since`.
- Retorna `Map<content, number>`.

Aplicar em três lugares:
- **A/B Lab**: já mostra Envios/Aterrissagens/CTR — manter, agora os números virão consistentemente do mesmo `utm_content`.
- **Links rápidos**: chip `· 12 acessos` ao lado do label.
- **Textos prontos**: chip `· 3 acessos (7d)` no header de cada `MessageCard`.

### 6. Testes
- Atualizar `src/lib/__tests__/utils.test.ts` (se existir) para cobrir `short + content`.
- Atualizar `whatsappText.test.ts` se algum snapshot mudar (gera link na assinatura).

## Sugestões adicionais

- **Botão "Copiar link curto"** isolado em cada card (separado de "Copiar texto") — útil para colar fora do WhatsApp.
- **QR code on-demand** para cada link curto (modal com `qrcode.react` já presente? checar) — facilita compartilhar em TV/print.
- **Janela de 24h** além de 7d/30d — pico imediato após envio.
- **Export CSV** dos acessos por template (download `/mnt/documents`-style do lado cliente).
- **Auto-pausar variante perdedora**: após N envios e diferença >X%, esconder a variante perdedora com badge "pausada".

Posso seguir só com itens 1–6 ou incluir as sugestões — qual prefere?

## Arquivos afetados

```text
src/lib/utils.ts                                  (buildDeepLink: short+content)
src/pages/ShareRedirect.tsx                        (ler ?c=)
src/components/admin/whatsapp/ABTemplateLab.tsx    (links curtos)
src/pages/admin/AdminWhatsApp.tsx                  (content nos links + chips de acesso)
src/hooks/useShareLandingCounts.ts                 (novo)
src/lib/__tests__/utils.test.ts                    (se existir)
```
