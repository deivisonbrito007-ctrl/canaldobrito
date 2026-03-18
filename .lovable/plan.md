

# Refatoracao Completa da Home — Mobile-First Streaming + Esportes

## Resumo

Reorganizar a pagina principal com hierarquia visual clara, remover duplicacoes e criar uma experiencia de app profissional de streaming/esportes.

## Estrutura Final da Home

```text
┌─────────────────────────┐
│  Header compacto        │  ← sticky, blur, logo + data
├─────────────────────────┤
│  HERO - Banners         │  ← 65vh, swipe, progress bar (maior elemento)
├─────────────────────────┤
│                         │
│  🔴 Ao Vivo Agora       │  ← scroll horizontal, badge pulsante, minuto
│                         │
├─────────────────────────┤
│  📋 Programacao do Dia  │  ← cards agrupados por periodo, filtro canal
├─────────────────────────┤
│  ✨ Novidades (Stories)  │  ← scroll horizontal compacto
├─────────────────────────┤
│  ▶ Assista Hoje (Grid)  │  ← grid 2 colunas, filmes+series unificados
├─────────────────────────┤
│  Footer simples         │  ← logo + WhatsApp + compartilhar
└─────────────────────────┘
```

## Mudancas por Arquivo

### 1. `src/pages/Index.tsx` — Simplificar layout
- Aumentar espacamento entre secoes (`space-y-10` / `gap-12`)
- Manter ordem: Header → Hero → Ao Vivo → Programacao → Novidades → Assista Hoje → Footer
- Remover WhatsAppFab (funcao movida para o footer)

### 2. `src/components/public/PublicHeader.tsx` — Mais compacto
- Reduzir padding vertical (`py-1`)
- Logo menor no mobile (`h-7`)
- Remover glow effect desnecessario

### 3. `src/components/public/DailyBannerCarousel.tsx` — Hero maior
- Aumentar altura para `65vh` no mobile, `60vh` desktop
- Remover margens laterais no mobile (full-bleed)
- Melhorar gradient overlay para leitura do titulo
- Progress bar mais visivel

### 4. `src/components/public/LiveNowSection.tsx` — Polir cards ao vivo
- Cards mais largos (`min-w-[260px]`)
- Badge "AO VIVO" mais proeminente com animacao pulsante
- Mostrar minuto em destaque maior
- Exibir canais dentro do card ao vivo
- Manter apenas jogos realmente ao vivo (ja funciona)

### 5. `src/components/public/DailyGamesSection.tsx` — Cards maiores
- Aumentar padding interno dos cards
- Times com fonte maior (`text-sm`)
- Horario mais destacado
- Espacamento entre grupos de periodo

### 6. `src/components/public/NewsReleasesSection.tsx` — Formato stories
- Cards mais estreitos e altos (estilo story: `w-[100px]` aspect `9/16`)
- Borda circular/arredondada como stories do Instagram
- Titulo menor, foco na imagem

### 7. `src/components/public/WatchTodaySection.tsx` — Grid 2 colunas fixo
- Forcar `grid-cols-2` sempre no mobile
- Cards maiores com mais respiracao
- Remover contagem do header (menos poluicao)

### 8. `src/components/public/PublicFooter.tsx` — Integrar WhatsApp
- Adicionar botao WhatsApp proeminente (verde, grande)
- Botao compartilhar ao lado
- Layout horizontal dos botoes
- Manter link discreto para /login

### 9. `src/components/public/WhatsAppFab.tsx` — Remover
- Funcionalidade movida para o footer (menos poluicao visual)

### 10. `src/index.css` — Ajustes globais
- Adicionar utilitario `scrollbar-hide` se nao existir
- Garantir animacoes de pulse para badge ao vivo

## Principios Aplicados
- Mobile-first: tudo desenhado para 320-430px primeiro
- Hierarquia clara: Hero domina, secoes bem separadas
- Sem duplicacao: filmes+series unificados em "Assista Hoje"
- Espacamento generoso entre blocos
- Touch targets minimo 44px
- Leitura rapida: titulos curtos, badges visuais, pouco texto

