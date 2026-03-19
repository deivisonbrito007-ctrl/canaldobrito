

# Carrossel Automático + Branding "Brito Solutions"

## Mudanças

### 1. Título "Brito Solutions" — estilo Dual Tone
Seguir o padrão de branding do projeto: **"Brito"** em branco e **"Solutions"** em verde esmeralda (`text-primary`), usando a fonte `font-body` (Outfit) em negrito. Remover o gradiente atual que mistura com roxo.

### 2. Carrossel automático (auto-scroll)
Transformar o carrossel manual em um **marquee infinito** que passa automaticamente:
- Duplicar os itens da lista para criar o efeito de loop contínuo
- Usar animação CSS `@keyframes scroll` que translada o container horizontalmente
- Pausar ao hover para o usuário poder ler
- Velocidade suave (~25s por ciclo completo)
- Remover snap scroll manual

### Arquivo a editar
- `src/components/public/CategoryIconsCarousel.tsx` — refatorar título + implementar auto-scroll com CSS animation
- `src/index.css` — adicionar keyframe `scroll` para o marquee

