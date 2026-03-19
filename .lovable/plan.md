

# Carrossel de Categorias Premium — Substituir DailyBannerCarousel

## Resumo
Substituir o `DailyBannerCarousel` (logo abaixo de "O que vai assistir hoje?") por um novo componente com:
1. **Mensagem premium**: "Brito Solutions — sua experiência premium de streaming com o canal informativo que você precisa dos seus esportes, filmes e séries favoritos"
2. **Carrossel horizontal de ícones** com categorias (Futebol, Basquete, UFC, Filmes, Séries, etc.)

O `DailyBannerCarousel` será apenas comentado/desabilitado (não removido) para poder ser reativado no futuro sem perder nada.

## Visual

```text
┌──────────────────────────────────────────────────┐
│  BRITO SOLUTIONS                                 │
│  Sua experiência premium de streaming com o      │
│  canal informativo que você precisa dos seus     │
│  esportes, filmes e séries favoritos             │
│                                                  │
│  [⚽ Futebol] [🏀 Basquete] [🥊 UFC/MMA]         │
│  [🎬 Filmes] [📺 Séries] [🏆 Esportes]    ───►  │
└──────────────────────────────────────────────────┘
```

## Arquivos

### Criar: `src/components/public/CategoryIconsCarousel.tsx`
- Mensagem premium com tipografia elegante (gradient no "Brito Solutions")
- Carrossel horizontal com snap scroll de pills/cards
- Ícones Lucide: `Trophy`, `Clapperboard`, `Tv`, `Swords`, `Dribbble`, `Flame`
- Visual glassmorphism nos cards, glow sutil no hover
- Animação de entrada com framer-motion (stagger)

### Editar: `src/pages/Index.tsx`
- Comentar `<DailyBannerCarousel />` (mantém código intacto)
- Inserir `<CategoryIconsCarousel />` no mesmo local
- Nenhuma outra seção é afetada

## Segurança
- Componente puramente visual, sem acesso a dados ou API
- Nenhuma alteração em hooks, banco ou serviços existentes

