

# Adaptar Banners ao Tamanho Real e Organizar por Categoria

## Problema Atual
- Os banners de esporte usam `aspect-video` (16:9) fixo, forçando qualquer imagem a esse formato -- imagens verticais ou panorâmicas ficam cortadas/distorcidas
- Todas as categorias de esporte aparecem em um carrossel único com abas, mas visualmente ficam "grandes demais"
- A categoria "Capa" existe no banco mas não aparece na home

## Plano

### 1. Adaptar banner ao tamanho real da imagem
- **Remover `aspect-video`** do `CategoryCarousel` e usar `aspect-auto` com `max-h-[400px]` (mobile) / `max-h-[500px]` (desktop)
- A imagem se adapta ao aspect ratio original do upload, com `object-contain` em vez de `object-cover` para não cortar
- Alternativa mais limpa: manter `object-cover` mas com aspect ratio `aspect-[16/10]` (mais baixo que 16:9)

### 2. Reorganizar esportes como carrossel horizontal por categoria (estilo Destaques)
Em vez de um carrossel grande com abas, cada categoria com banners vira uma **seção independente** com scroll horizontal de cards, similar ao `WeeklyMoviesSection`:

```text
┌─────────────────────────────────┐
│ ⚽ Futebol                       │
│ ┌──────┐ ┌──────┐ ┌──────┐     │
│ │ img  │ │ img  │ │ img  │ ──► │
│ │      │ │      │ │      │     │
│ │título│ │título│ │título│     │
│ └──────┘ └──────┘ └──────┘     │
│                                 │
│ 🏀 Basquete                     │
│ ┌──────┐ ┌──────┐              │
│ │ img  │ │ img  │          ──► │
│ └──────┘ └──────┘              │
│                                 │
│ 🥊 UFC/MMA                      │
│ ┌──────┐                        │
│ │ img  │                        │
│ └──────┘                        │
└─────────────────────────────────┘
```

- Cards com largura fixa `w-[260px]` e aspect ratio flexível (ex: `aspect-[4/3]`) para acomodar imagens de diferentes proporções
- Scroll horizontal com snap, igual aos destaques de filmes
- Cada categoria só aparece se tiver banners ativos
- Título da seção com emoji + nome da categoria + linha decorativa

### 3. Categoria "Capa" como banner hero
- Usar banners da categoria `cover` no `DailyBannerCarousel` como fallback quando não houver daily banners
- Ou exibir como seção destacada no topo ("Destaques Canal do Brito")

### 4. Guia do Futebol
- Manter como seção separada mas com o mesmo estilo de cards horizontais

## Arquivos a editar
- `src/components/public/BannerSections.tsx` -- refatorar para layout de cards horizontais por categoria
- `src/hooks/useBanners.ts` -- sem alterações (já suporta tudo)
- `src/pages/Index.tsx` -- possivelmente integrar categoria "cover"

