

# Melhorar Header (AppNavbar) e Footer (PublicFooter)

## Header (AppNavbar) - Melhorias

- Adicionar gradiente sutil na borda inferior em vez de borda sólida
- Logo maior com leve glow animado de marca
- Texto "BRITO SOLUTIONS" com gradiente (text-gradient-primary) para consistência visual
- Data com ícone de calendário pequeno para mais contexto visual
- Botão de busca com efeito hover mais premium (glow sutil)

## Footer (PublicFooter) - Melhorias

- Separador com gradiente horizontal (fade nas pontas) em vez de borda simples
- Logo centralizado com glow sutil da cor primária
- Texto "Sua experiência premium de streaming" como tagline abaixo do logo
- Links de "Sobre" e "Contato" como texto discreto (opcional, visual)
- Copyright com link admin oculto mantido
- Espaçamento extra para não ficar atrás do BottomNav (pb-20)

## Arquivos a editar

### 1. `src/components/public/AppNavbar.tsx`
- Trocar título para usar `text-gradient-primary`
- Adicionar ícone de calendário ao lado da data
- Melhorar efeito hover do botão de busca com `hover:border-primary/30 hover:glow-primary-subtle`
- Borda inferior com gradiente via pseudo-elemento ou classe `section-divider`

### 2. `src/components/public/PublicFooter.tsx`
- Separador superior com gradiente (`section-divider`)
- Logo com opacidade maior e glow primário sutil
- Tagline "Sua experiência premium de streaming"
- Padding inferior generoso para compensar BottomNav
- Manter link admin oculto no copyright

