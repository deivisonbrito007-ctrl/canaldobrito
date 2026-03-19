

# Corrigir Link de Compartilhamento — Evitar Login no Lovable

## Problema
Todos os componentes de compartilhamento (WhatsAppShareButton, WhatsAppFab, AdminWhatsApp) usam `window.location.href` / `window.location.origin` para gerar o link. Como o app roda no preview do Lovable (`id-preview--xxx.lovable.app`), esse link exige login no Lovable para acessar.

O app precisa ser **publicado** para ter uma URL pública (ex: `xxx.lovable.app`), mas mesmo assim o código deve usar uma URL configurável para que o link compartilhado seja sempre o correto.

## Solução

### 1. Adicionar configuração `site_url` na tabela settings
- No admin Configurações, adicionar um campo para o usuário definir a URL pública do site (ex: `https://seudominio.com` ou a URL publicada do Lovable)
- Salvar como `site_url` na tabela `settings`

### 2. Criar helper `getSiteUrl()`
- Novo utilitário que busca `site_url` das settings
- Fallback para `window.location.origin` se não configurado

### 3. Atualizar componentes de compartilhamento
- **`WhatsAppShareButton.tsx`** — usar `site_url` das settings em vez de `window.location.href`
- **`WhatsAppFab.tsx`** — mesma correção
- **`AdminWhatsApp.tsx`** — usar `site_url` em vez de `window.location.origin`

### 4. Adicionar campo no admin Configurações
- **`AdminConfiguracoes.tsx`** — adicionar input para "URL pública do site" com placeholder e explicação

## Arquivos a editar
- `src/pages/admin/AdminConfiguracoes.tsx` — campo para configurar URL
- `src/components/public/WhatsAppShareButton.tsx` — usar settings
- `src/components/public/WhatsAppFab.tsx` — usar settings
- `src/pages/admin/AdminWhatsApp.tsx` — usar settings

## Ação imediata recomendada
Além desta correção, o app precisa ser **publicado** clicando em "Publish" no canto superior direito do editor. Isso gera uma URL pública (`xxx.lovable.app`) que não exige login.

