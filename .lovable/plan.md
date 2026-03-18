

# Corrigir Imagem com Zoom Excessivo — NewsReleasesSection

## Problema
As imagens usam `object-cover` que preenche o container cortando partes da imagem. Como as capas de filmes/séries geralmente são em formato **retrato (poster 2:3)** e o container é **paisagem (wide)**, o resultado é um zoom excessivo cortando o conteúdo principal.

## Solução

**Arquivo:** `src/components/public/NewsReleasesSection.tsx`

Trocar a estratégia de exibição da imagem:

1. **Imagem principal**: Mudar de `object-cover` para `object-contain` — mostra o poster inteiro sem cortar
2. **Fundo blur**: Adicionar a mesma imagem como background com `object-cover` + `blur-2xl` + `scale-110` + opacidade reduzida — preenche o espaço vazio com um efeito de cor desfocada (estilo Spotify/Netflix quando mostra poster vertical)
3. **Centralizar**: A imagem principal fica centralizada com `object-contain` mostrando 100% do conteúdo

Resultado visual:
```text
┌──────────────────────────────────┐
│  [blur background da imagem]     │
│       ┌──────────────┐           │
│       │              │           │
│       │  POSTER      │           │
│       │  COMPLETO    │           │
│       │              │           │
│       └──────────────┘           │
│  [gradiente + título + badge]    │
└──────────────────────────────────┘
```

Isso resolve o problema de corte mantendo o visual premium — funciona tanto para imagens retrato (posters) quanto paisagem (banners).

