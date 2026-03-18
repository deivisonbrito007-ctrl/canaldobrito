

# Redesign Premium da Página Pública — Netflix/ESPN Style

## Visão Geral

Transformar a página pública de um layout funcional para uma experiência visual premium de streaming, com hero imersivo, cards cinematográficos, scroll horizontal fluido e fundo ultra-escuro.

---

## Mudanças

### 1. CSS Global (`src/index.css`)
- Fundo principal mais escuro: `--background: 0 0% 2%` (~#050505)
- Card: `--card: 0 0% 7%` (~#111)
- Adicionar utilitário `.glow-primary-subtle` para glow verde suave em hover

### 2. Hero Principal (`src/components/public/DailyBannerCarousel.tsx`)
- Aumentar altura para `80vh` mobile / `75vh` desktop
- Overlay gradiente mais forte (from-black/95 via-black/60)
- Texto sobreposto com hierarquia: título grande (text-2xl/3xl bold), subtítulo menor
- Botão de ação "Ver Programação" com estilo primary + glow
- Progress bars mais grossas e visíveis
- Animação de entrada com scale + fade

### 3. Seção Jogos Ao Vivo (`src/components/public/LiveNowSection.tsx`)
- Cards com fundo `#111` e borda sutil `border-white/5`
- Glow verde suave no card quando ao vivo
- Tipografia dos times maior (text-base/lg)
- Canais com cor primary
- Mais padding interno

### 4. Banners por Categoria (`src/components/public/BannerSections.tsx`)
- Imagens com overlay gradiente escuro na parte inferior
- Título da categoria sobre a imagem (bottom-left)
- Bordas arredondadas maiores (rounded-2xl)
- Hover com scale(1.02) e sombra

### 5. Novidades/Stories (`src/components/public/NewsReleasesSection.tsx`)
- Cards maiores: `w-[130px] sm:w-[150px]`
- Borda com glow primary sutil em vez de borda simples
- Título com fonte maior e melhor contraste
- Gap maior entre cards

### 6. Assista Hoje (`src/components/public/WatchTodaySection.tsx`)
- Trocar grid por **scroll horizontal** com snap
- Cards maiores: `w-[160px] sm:w-[200px]`
- Hover com scale(1.03) e sombra premium
- Badge de tipo (Filme/Série) mais elegante com glassmorphism
- Overlay gradiente mais suave

### 7. Layout da Página (`src/pages/Index.tsx`)
- Mais espaçamento entre seções: `space-y-14 sm:space-y-20`
- Remover seção BannerSections do fluxo principal (mover para dentro do hero ou simplificar)
- Manter ordem: Hero → Ao Vivo → Novidades → Assista Hoje
- Padding lateral consistente

### 8. Header (`src/components/public/PublicHeader.tsx`)
- Fundo mais transparente com blur forte
- Borda inferior mais sutil
- Logo ligeiramente maior

---

## Arquivos Editados

1. `src/index.css` — cores de fundo + utilitários
2. `src/pages/Index.tsx` — layout e espaçamento
3. `src/components/public/DailyBannerCarousel.tsx` — hero imersivo
4. `src/components/public/LiveNowSection.tsx` — cards premium
5. `src/components/public/BannerSections.tsx` — overlay + hover
6. `src/components/public/NewsReleasesSection.tsx` — stories maiores
7. `src/components/public/WatchTodaySection.tsx` — scroll horizontal
8. `src/components/public/PublicHeader.tsx` — header refinado

