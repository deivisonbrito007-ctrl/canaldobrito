

# Refatoracao Mobile-First Completa

## Escopo

Este e um projeto grande. Vou dividir em duas fases para manter qualidade:

**Fase 1 (esta implementacao):** Refatorar toda a interface publica mobile-first + admin responsivo
**Fase 2 (proxima):** Sistema de geracao de imagens WhatsApp Status (9:16) + templates de mensagem

---

## Fase 1 — Alteracoes

### 1. PublicHeader — Compactar para mobile
- Reduzir altura: `py-2` no mobile, logo `h-8`
- Data mais compacta
- Melhor contraste

### 2. DailyBannerCarousel — Hero mobile otimizado
- Altura `h-[55vh]` mobile (era 60vh, muito em telas 320px)
- Bordas arredondadas `rounded-xl` no mobile
- Margem lateral `mx-3` no mobile
- Progress bar animada no bottom (substituir dots)
- Titulo overlay no banner com gradiente mais forte

### 3. LiveNowSection — Cards mais compactos
- `min-w-[220px]` (era 260px — nao cabe bem em 320px)
- Padding `p-3` (era p-4)
- Fontes menores nos times
- Touch targets minimos 44px nos swipe areas

### 4. DailyGamesSection — Grid mobile otimizado
- Cards em coluna unica no mobile (`grid-cols-1`)
- Padding e fonte reduzidos
- Canais em linha unica com ellipsis se muitos
- Filtro de canal com touch targets maiores (`min-h-[36px] min-w-[44px]`)

### 5. NewsReleasesSection — Stories compactos
- `w-[140px]` no mobile (era 180px)
- Limitar a 5 itens no mobile via `.slice(0, 5)`
- Esconder secao se vazia (ja faz)
- Remover overview no mobile

### 6. WatchTodaySection — Grid 2 colunas premium
- `grid-cols-2 gap-3` no mobile (gap era 4)
- Remover overview no mobile
- Cards com `rounded-xl` (era 2xl — mais compacto)
- Integrar ContentDetailSheet (onClick abre detalhes)
- Esconder secao se vazia

### 7. PublicFooter — Simplificar
- Remover telefone (ja tem WhatsApp)
- Layout mais compacto: logo + nome + WhatsApp share button + copyright
- Menos padding vertical

### 8. WhatsAppFab — Melhorar touch
- `h-14 w-14` (era h-12 w-12) para melhor touch target
- Posicao `bottom-4 right-4`

### 9. AdminLayout — Responsivo mobile
- Tabs com icone apenas no mobile (labels ja hidden)
- Touch targets maiores nos tabs (`min-h-[44px]`)
- Content padding reduzido no mobile

### 10. Index.tsx — Espacamento mobile
- `space-y-8` no mobile, `sm:space-y-12`
- `py-4` no mobile (era py-6)

### 11. CSS — Novas utilidades mobile
- `.touch-target` com `min-h-[44px] min-w-[44px]`
- Melhorar `.glass-card` para performance mobile (reduce blur em telas pequenas)

---

## Fase 2 (proxima iteracao) — WhatsApp Status Templates

Criar componente admin `WhatsAppStatusGenerator` com:
- 3 templates de imagem 9:16 (Programacao, Ao Vivo, Assista Hoje)
- Renderizacao via canvas/html2canvas
- Botao de download como imagem
- Templates de texto pre-formatados para copiar

---

## Arquivos Modificados (Fase 1)

| Arquivo | Acao |
|---------|------|
| `src/components/public/PublicHeader.tsx` | Compactar mobile |
| `src/components/public/DailyBannerCarousel.tsx` | Hero mobile + progress bar |
| `src/components/public/LiveNowSection.tsx` | Cards menores |
| `src/components/public/DailyGamesSection.tsx` | Grid mobile + touch targets |
| `src/components/public/NewsReleasesSection.tsx` | Stories menores, max 5 |
| `src/components/public/WatchTodaySection.tsx` | Grid 2col + ContentDetailSheet |
| `src/components/public/PublicFooter.tsx` | Simplificar |
| `src/components/public/WhatsAppFab.tsx` | Touch target maior |
| `src/pages/Index.tsx` | Espacamento mobile |
| `src/pages/AdminLayout.tsx` | Tabs responsivos |
| `src/index.css` | Utilidades mobile |

