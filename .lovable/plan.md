

# Melhorar Footer e Navbar -- mais visibilidade e consistencia com a marca

## Problemas identificados

1. **Footer apagado**: logo pequena (h-8), textos com opacidade muito baixa (`text-muted-foreground/40`, `/15`), tamanho minusculo (`text-[10px]`, `text-[9px]`)
2. **Navbar**: logo pequena (h-10 w-10), nome com tracking muito espacado
3. **Cores inconsistentes**: o gradiente `text-gradient-primary` vai de verde para roxo, mas a logo tem verde + azul. Os textos secundarios estao quase invisiveis

## Plano

### 1. `src/components/public/PublicFooter.tsx`
- Aumentar logo de `h-8` para `h-12`
- Aumentar nome "Brito Solutions" de `text-xs` para `text-base font-bold`
- Aumentar subtitulo de `text-[10px]` com `/40` para `text-xs` com `/60`
- Aumentar copyright de `text-[9px]` com `/15` para `text-[10px]` com `/30`
- Adicionar mais padding vertical (`py-10`)

### 2. `src/components/public/AppNavbar.tsx`
- Aumentar logo de `h-10 w-10` para `h-11 w-11`
- Aumentar nome de `text-lg` para `text-xl`
- Aumentar data de `text-[10px]` para `text-[11px]`

### 3. `src/index.css` -- Ajustar gradiente de texto
- Atualizar `.text-gradient-primary` para usar tons mais proximos da logo (verde esmeralda para azul/ciano em vez de roxo), mantendo consistencia com a identidade visual

## Arquivos a editar
- `src/components/public/PublicFooter.tsx`
- `src/components/public/AppNavbar.tsx`
- `src/index.css`

