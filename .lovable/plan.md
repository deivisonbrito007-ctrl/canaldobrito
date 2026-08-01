## O que a auditoria mostrou

Rodei uma varredura automatizada (Chromium mobile 384x715 e 320x700) em todas as telas públicas e do admin, medindo largura do documento, elementos fora da tela e altura dos controles.

Boa notícia: **nenhuma página tem rolagem horizontal indevida em 384px** — não há layout "quebrando" a tela. Os elementos que aparecem fora do viewport são decorativos (blobs de fundo) ou trilhas de rolagem horizontal intencionais (filtros de esporte, marquee da página Assine).

Problemas reais confirmados:

1. **`/admin/whatsapp` em 320px** — o documento fica com 326px de largura, gerando rolagem horizontal lateral na tela (algum elemento com largura mínima fixa).
2. **`/admin/canais-logos`** — a lista de abas mede 406px dentro de um container de 320px e não é rolável: parte das abas fica inacessível em telas pequenas.
3. **Toques abaixo de 44px** (regra do projeto) em vários pontos:
   - Admin Banners: chips de filtro/esporte com 19px e switches de 24px.
   - Admin Auditoria: botões de expandir payload com 28px.
   - Admin Novidades / WhatsApp: inputs e selects com 36px, botões com 28-36px.
   - Público: setas do carrossel de Novidades com 36px e "dots" de 6px sem área de toque ampliada.
4. **Tabela de Analytics** (`min-w-[480px]`) rola dentro do card, mas sem nenhuma indicação visual de que há mais conteúdo à direita.
5. **Transição entre abas na home** desloca todo o conteúdo horizontalmente durante a animação (medido em -60px). Não sobra rolagem depois, mas em aparelhos lentos aparece como um "salto" lateral.

## O que pretendo corrigir

**Correções de layout**
- Localizar e remover a largura fixa que causa o overflow de 6px em `/admin/whatsapp` (provável `min-w`/tabela/`grid` sem `min-w-0`).
- Tornar a `TabsList` de `/admin/canais-logos` rolável horizontalmente (ou em grade de 2 colunas no mobile), garantindo acesso a todas as abas em 320px.
- Adicionar `overflow-hidden` nos containers dos blobs decorativos da página `/assinar` para evitar qualquer vazamento em telas futuras.
- Adicionar máscara/gradiente de "há mais conteúdo" nas tabelas e trilhas roláveis (Analytics, filtros de esporte, chips de banners).

**Padronização de toque (44px)**
- Elevar chips, botões-ícone, switches e inputs abaixo de 40px para `min-h-11` (ou área de toque ampliada via padding/`::after`) nas telas: Banners, Auditoria, Novidades, WhatsApp, Canais/Logos, Analytics.
- Setas do carrossel público: 44px; dots mantêm o visual de 6px mas ganham área de toque de 44px.

**Estabilidade da animação**
- Trocar o deslize horizontal da troca de abas por fade/deslize vertical curto (coerente com a regra do projeto de evitar interações horizontais), eliminando o salto lateral.

**Verificação**
- Reexecutar a varredura em 320px, 384px e 430px em todas as rotas, conferindo: largura do documento igual à do viewport, zero controles abaixo de 44px e nenhuma sobreposição do menu inferior sobre o conteúdo (área segura do iOS).

## Detalhes técnicos

- Arquivos previstos: `src/pages/admin/AdminWhatsApp.tsx`, `AdminCanaisLogos.tsx`, `AdminBanners.tsx`, `AdminAudit.tsx`, `AdminAnalytics.tsx`, `AdminNovidades.tsx`, `src/pages/Assinar.tsx`, `src/components/public/cinema/CinemaHero.tsx`, além do container de abas da home.
- Sem mudanças de banco, de regras de negócio ou de conteúdo — apenas CSS/JSX de apresentação.
- Tokens semânticos existentes serão reutilizados; nenhuma cor nova será adicionada.
