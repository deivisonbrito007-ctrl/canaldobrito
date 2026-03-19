

# Mostrar Banner Completo sem Cortar a Imagem

## Problema
Os cards de banner usam `aspect-[4/3]` com `object-cover`, o que **corta** a imagem para encaixar no formato fixo. Imagens com proporções diferentes (ex: verticais, panorâmicas) perdem conteúdo.

## Solução
Trocar de cards com aspect ratio fixo para cards que **mostram a imagem inteira**, usando `object-contain` com fundo escuro, ou melhor ainda: **remover o aspect ratio fixo** e deixar a imagem definir sua própria altura.

### Mudanças no `BannerSections.tsx`

**BannerCard:**
- Remover `aspect-[4/3]` da `<img>` e do fallback
- Usar `w-full` + `object-contain` para exibir a imagem completa sem corte
- Adicionar `max-h-[300px] sm:max-h-[400px]` para limitar altura máxima
- Manter `bg-black/50` como fundo atrás da imagem para preencher espaço vazio
- Aumentar largura do card para `w-[300px] sm:w-[360px]` para dar mais espaço à imagem

**Resultado visual:**
- A imagem aparece **inteira**, sem corte
- Cards maiores para melhor visualização
- Fundo escuro preenche qualquer espaço vazio ao redor da imagem

### Arquivo a editar
- `src/components/public/BannerSections.tsx`

