

# Remover feature "Banner do Dia" (daily_banner) do sistema

## Escopo

A feature `daily_banner` existe em 3 locais e não é usada no frontend público (o componente `DailyBannerCarousel` não é importado em nenhuma página). A remoção é segura.

## Mudanças

### 1. `src/pages/admin/AdminBanners.tsx`
- Remover import do `useDailyBanners` (linha 5)
- Remover componente `DailyBannerManager` (linhas 72-230 aprox.)
- Remover a aba "📺 Dia" do array de seções (linha 261)
- Remover o render condicional `activeSection === "daily"` (linha 279)
- Ajustar `activeSection` default de `"daily"` para `"categories"`

### 2. Arquivos a deletar
- `src/hooks/useDailyBanners.ts` — hooks CRUD do daily_banner
- `src/components/public/DailyBannerCarousel.tsx` — componente público (não usado)

### 3. Tabela `daily_banner`
- A tabela no banco permanece intacta (não causa problemas). Se quiser remover futuramente, pode ser feito via migration.

## Impacto
- Zero impacto no sistema atual — o `DailyBannerCarousel` não é importado em nenhuma página pública
- O admin perde apenas a aba "Dia" que será substituída pela aba "Categorias" como default

## Sugestão adicional
- Trocar o default do admin de banners para abrir direto em "Categorias" já que é a aba mais utilizada

