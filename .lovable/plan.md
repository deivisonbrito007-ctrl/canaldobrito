

# Melhorar Visualização Mobile — Aba Destaques e Home

## Problemas Identificados (screenshot)

1. **Cards de filmes/séries muito pequenos** — largura de 150px em telas de 384px mostra apenas 2 cards parciais, texto do título muito pequeno (`text-[12px]`), gênero quase ilegível (`text-[9px]`)
2. **Espaçamento excessivo entre seções** — gaps de `space-y-6` no Index e `space-y-8` empurram conteúdo para baixo desnecessariamente
3. **Carrossel de categorias ocupa muito espaço** — texto descritivo longo + marquee usa ~160px de altura que poderia ser mais compacto
4. **Cards de filmes/séries não mostram gênero de forma visível** — badge de gênero muito pequeno e com pouco contraste
5. **Título na área inferior dos cards sobrepõe imagem** — gradiente `from-black/95` ajuda mas o padding `p-3` deixa pouco espaço

## Plano de Melhorias

### 1. Cards de filmes e séries maiores no mobile
- Aumentar largura de `w-[150px]` para `w-[170px]` no mobile (melhora legibilidade sem perder o snap scroll)
- Aumentar título para `text-[13px]` e gênero para `text-[10px]`
- Aumentar rating badge ligeiramente para melhor toque (`min-h-[28px]`)
- Aplicar em `WeeklyMoviesSection.tsx` e `WeeklySeriesSection.tsx`

### 2. Carrossel de categorias mais compacto
- Reduzir texto descritivo de 2 linhas para 1 linha com `line-clamp-1`
- Diminuir padding vertical de `py-6` para `py-4`
- Reduzir `space-y-5` para `space-y-3`

### 3. Espaçamento geral otimizado na Home
- Reduzir `space-y-8` entre seções na Home para `space-y-6`
- Ajustar padding top de `pt-5` para `pt-4`

### 4. Novidades carousel — info mais legível
- Aumentar tamanho dos badges de metadados para melhor toque (padding `px-3 py-1.5`)
- Gêneros com fonte maior (`text-[11px]`) e mais contraste (`text-white/70`)
- Título com `text-shadow` mais forte

### 5. SectionHeader mais compacto no mobile
- Reduzir gap e tamanho do ícone container levemente para ganhar espaço horizontal

### Arquivos alterados
- `src/components/public/WeeklyMoviesSection.tsx`
- `src/components/public/WeeklySeriesSection.tsx`
- `src/components/public/CategoryIconsCarousel.tsx`
- `src/components/public/NewsReleasesSection.tsx`
- `src/pages/Index.tsx`

