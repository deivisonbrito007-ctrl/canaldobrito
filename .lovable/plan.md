

# Corrigir botão "Assine já" no AppNavbar

## Problema
O botão "Assine já" no header (`AppNavbar.tsx`) ainda aponta para o WhatsApp direto (`wa.me/...`) em vez de redirecionar para a página `/assinar`.

## Mudança
No `src/components/public/AppNavbar.tsx`, trocar o `<a href="wa.me/...">` por um `<Link to="/assinar">` do React Router, igual foi feito no `PromoStrip.tsx`.

