

# Auditoria de Compatibilidade Mobile

## Resultado da Auditoria

Analisei todos os componentes públicos da aplicação com foco em mobile (320px-430px). O projeto já está bem otimizado para mobile, mas identifiquei alguns problemas e melhorias:

### Problemas Encontrados

**1. Botão de fechar do TrailerModal sem touch target adequado**
O botão de fechar o trailer (linha 31-37 de `TrailerModal.tsx`) tem `p-2` mas sem `min-h-[44px]` / `min-w-[44px]`, dificultando o toque em telas pequenas.

**2. Botão de lembrete nos GameCards muito pequeno**
Em `DailyGamesSection.tsx` (linha 193-204), o botão de reminder tem apenas `p-1` (24x24px efetivo), abaixo do mínimo de 44px recomendado para touch targets.

**3. Filter pills sem touch target mínimo**
Os botões de filtro expandidos (linhas 483-501, 515-535, 549-569 de `DailyGamesSection.tsx`) usam `px-2.5 py-1.5` sem `min-h-[44px]`, tornando difícil tocar com precisão no mobile.

**4. Grain overlay com z-index 9999 pode bloquear interações**
O `.grain-overlay` em `index.css` (linha 168) tem `z-index: 9999` e `pointer-events: none`. Embora `pointer-events: none` resolva, em alguns browsers mais antigos pode causar problemas. O z-index excessivo pode interferir com modais (TrailerModal usa z-[70], LoginModal usa z-[100]).

**5. ContentDetailSheet sem safe-area no padding inferior**
Em `ContentDetailSheet.tsx` (linha 84), o `pb-24` fixo não usa `env(safe-area-inset-bottom)`, o que pode ocultar conteúdo em iPhones com home indicator.

**6. Página Assinar: sticky CTA pode sobrepor conteúdo**
Na página `Assinar.tsx`, o sticky CTA no bottom não tem proteção de safe-area para iPhones com notch.

### O que Já Está Correto
- BottomNav respeita `env(safe-area-inset-bottom)`
- Touch targets de 44px na maioria dos botões (navbar, bottom nav, login form, carousel arrows)
- `overflow-x-hidden` no container principal previne scroll horizontal
- Tipografia fluida com `clamp()` no Hero
- `viewport-fit=cover` no HTML
- `prefers-reduced-motion` respeita acessibilidade
- Scrollbar hide nos carrosséis
- Truncate em textos longos de times/competições
- iOS keyboard viewport adjustment no LoginModal

---

## Plano de Correção (3 arquivos)

### 1. `src/components/public/TrailerModal.tsx`
- Adicionar `min-h-[44px] min-w-[44px]` ao botão de fechar

### 2. `src/components/public/DailyGamesSection.tsx`
- Aumentar touch target do botão de reminder para `min-h-[44px] min-w-[44px]`
- Adicionar `min-h-[44px]` nos filter pills expandidos

### 3. `src/components/public/ContentDetailSheet.tsx`
- Substituir `pb-24` por `paddingBottom: calc(6rem + env(safe-area-inset-bottom, 0px))` para proteger conteúdo em iPhones

### 4. `src/pages/Assinar.tsx`
- Adicionar `env(safe-area-inset-bottom)` no sticky CTA inferior

### Arquivos modificados
- `src/components/public/TrailerModal.tsx`
- `src/components/public/DailyGamesSection.tsx`
- `src/components/public/ContentDetailSheet.tsx`
- `src/pages/Assinar.tsx`

