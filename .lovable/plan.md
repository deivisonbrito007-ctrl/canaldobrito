## Contexto

Boa parte da estrutura proposta no prompt **já existe** na página `NovidadesPage.tsx`:

- Hero header com título, contador e botão de busca
- Filtros rápidos horizontais (`FilterChip`) com snap + scroll
- Carrossel de destaques (`NovidadesCard`) — auto-rotate + trailer
- Sugestões da Semana (`WeeklyMoviesSection` / `WeeklySeriesSection`)
- Grid/Lista (`ContentCard`, `ContentListItem`) com toggle
- Busca (`SearchModal`)
- Badges (`BadgePill`) com gradientes
- Skeleton shimmer + lazy loading

Existe inclusive um `FeaturedCarousel.tsx` (versão "rica" com backdrop grande, dots e ações) que **não está em uso** — foi substituído pelo `NovidadesCard` por decisão anterior.

Portanto o plano foca apenas nos **gaps reais** entre o spec e o que já está no ar, evitando refazer o que funciona.

## O que será feito

### 1. Carrossel de destaques mais rico (opcional/aditivo)
- **Manter** o `NovidadesCard` como hero principal (decisão já registrada em memória).
- **Não** voltar a usar `FeaturedCarousel` agora — evita conflito visual com NovidadesCard. Será removido do projeto se confirmado que não há mais uso.

### 2. Melhorias no `ContentCard` (grid)
- Adicionar overlay de hover com botão "Ver Detalhes" (atualmente só escala).
- Garantir badge de tipo (Filme/Série) no canto, além do badge de status.
- Manter rating com estrela amarela já existente.

### 3. Melhorias no `ContentListItem` (lista)
- Adicionar `ChevronRight` à direita para indicar ação.
- Mostrar `BadgePill` size `xs` ao lado do tipo + ano.
- Garantir line-clamp 2 no overview.

### 4. Ordenação na grade/lista
- Adicionar `<select>` simples acima da grid quando houver filtro ativo:
  - Mais Recentes (padrão, por `created_at`)
  - Melhor Avaliados (`rating` desc)
  - A–Z (`title`)
  - Ano (`year` desc)
- Estado local; sem persistir.

### 5. Prefetch de imagens vizinhas no carrossel
- No `NovidadesCard`, adicionar `link rel=preload as=image` para o item anterior e próximo do índice atual, dentro de `useEffect`.

### 6. Polimento dos `BadgePill`
- Conferir glow/shadow nos tamanhos `xs` e `sm` (atualmente só `md` tem glow forte).
- Padronizar `nova_temporada` com emoji 🎞️ (já usado no filtro) ou manter 📺 — alinhar com o filtro chip.

### 7. SEO / título da aba
- Já atualizado em mensagem anterior (mantido).

## O que NÃO entra (justificativa)

- **Página dedicada `/s/novidades`**: a UX atual usa abas dentro de `Index.tsx` (memória `home-page-layout`). Criar rota separada quebraria o padrão.
- **Infinite scroll**: volume atual de itens é pequeno (curadoria manual). Paginação não traz ganho.
- **Favoritos / Compartilhar por item**: feature nova, fora do escopo deste prompt visual.
- **Auto-play 5s no carrossel**: já existe no `NovidadesCard`.
- **Voltar a usar `FeaturedCarousel`**: o usuário já pediu explicitamente para manter o `NovidadesCard` como hero.

## Arquivos afetados

- `src/components/public/novidades/ContentCard.tsx` — overlay hover + badge tipo
- `src/components/public/novidades/ContentListItem.tsx` — chevron + badge
- `src/components/public/novidades/BadgePill.tsx` — glow nos tamanhos menores
- `src/components/public/NovidadesPage.tsx` — adicionar `<select>` de ordenação e aplicar sort
- `src/components/public/NovidadesCard.tsx` — prefetch das imagens vizinhas
- (cleanup) remover `src/components/public/novidades/FeaturedCarousel.tsx` se sem referências

## Resultado esperado

A aba **Filmes e Séries** ganha:
- Cards mais informativos no grid (overlay de ação + badge tipo)
- Lista com chevron e badge de status
- Ordenação rápida quando o usuário filtra
- Carrossel ainda mais fluido (prefetch de imagens)
- Badges visualmente consistentes em todos os tamanhos

Sem quebrar a estrutura de abas atual nem a hierarquia visual já validada.