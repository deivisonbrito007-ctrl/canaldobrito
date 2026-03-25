

# Auditoria da Página Pública

## Problemas Encontrados

### 1. NotFound (404) sem branding
A página 404 usa estilo genérico (`bg-muted`, texto em inglês "Oops! Page not found"). Deveria seguir o design system do app com fundo escuro, branding e texto em português.

### 2. Hero — label "Esta noite" incorreta
O stat bar mostra "Esta noite" para o total de jogos, mas inclui jogos de todos os períodos (manhã, tarde, noite). Deveria ser "Hoje" para refletir corretamente.

### 3. CategoryIconsCarousel — badge "8" hardcoded
O item "Em Alta" tem `badge: "8"` fixo. Deveria refletir dados reais ou ser removido para evitar informação falsa.

### 4. "Ver todos →" no LiveFeedSection sem ação
O link "Ver todos →" (linha 152-154) é um `<span>` com `cursor-pointer` mas sem `onClick` ou link real. Deveria navegar para a aba Programação ou ser removido.

### 5. ContentDetailSheet sem backdrop_url
O `ContentDetailSheet` aceita `backdrop_url` mas o `NovidadesCard` nunca passa esse campo (usa apenas `poster_url: selectedItem.image_url`). O backdrop poderia vir do TMDB para enriquecer a experiência.

### 6. Grain overlay z-index 9999
O `.grain-overlay` usa `z-index: 9999`, que é excessivo. Modais usam z-[60] a z-[100]. Reduzir para `z-[55]` (abaixo dos modais) é mais seguro para compatibilidade.

---

## Plano de Correção

### 1. `src/pages/NotFound.tsx`
- Redesenhar com branding Canal do Brito (fundo escuro, logo SVG, texto em português, botão de volta estilizado)

### 2. `src/components/public/Hero.tsx`
- Trocar label "Esta noite" por "Hoje" na stat bar

### 3. `src/components/public/CategoryIconsCarousel.tsx`
- Remover badge hardcoded "8" do item "Em Alta"

### 4. `src/components/public/LiveFeedSection.tsx`
- Converter "Ver todos →" em botão funcional que navega para a aba Programação, ou remover

### 5. `src/index.css`
- Reduzir z-index do `.grain-overlay` de 9999 para 55

### Arquivos modificados
- `src/pages/NotFound.tsx`
- `src/components/public/Hero.tsx`
- `src/components/public/CategoryIconsCarousel.tsx`
- `src/components/public/LiveFeedSection.tsx`
- `src/index.css`

