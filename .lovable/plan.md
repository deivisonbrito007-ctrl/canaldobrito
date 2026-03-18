

# Clipboard Paste para Banners + Reorganizacao da Home

## 1. Admin — Adicionar "Colar Imagem" (Clipboard Paste)

**Arquivo:** `src/pages/admin/AdminBanners.tsx`

O pedido e para **colar uma imagem copiada** (Ctrl+V / clipboard paste), nao colar um link URL. Implementacao:

- Adicionar uma area de drop/paste em ambos os gerenciadores (Daily e Categorias)
- Escutar o evento `onPaste` no container — quando o usuario cola uma imagem do clipboard, extrair o `File` do `clipboardData.items`
- Fazer upload automatico para o storage (mesmo fluxo do upload de arquivo)
- Feedback visual: area com borda tracejada e texto "Cole uma imagem aqui (Ctrl+V)" que muda de cor ao receber paste
- Manter o botao Upload existente como alternativa

Logica tecnica:
```
onPaste -> clipboardData.items -> find type "image/*" -> getAsFile() -> upload to storage -> create banner
```

## 2. Home Publica — Reorganizar BannerSections

**Arquivo:** `src/components/public/BannerSections.tsx`

Problemas atuais:
- "Capa" e redundante com o `DailyBannerCarousel` que ja serve de hero
- 6 carrosseis empilhados e repetitivo

Mudancas:
- **Omitir "cover"** do loop — o DailyBannerCarousel ja cumpre essa funcao
- **Agrupar esportes** (football, basketball, ufc, other_sports) em uma unica secao "Esportes" com pills de filtragem entre modalidades
- **Manter "Guia do Futebol"** como secao separada (conteudo editorial)

Resultado: de 6 secoes -> 2 secoes (Esportes com pills + Guia do Futebol)

## Arquivos a editar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/admin/AdminBanners.tsx` | Adicionar area de clipboard paste em DailyBannerManager e no gerenciador de Categorias |
| `src/components/public/BannerSections.tsx` | Omitir cover, agrupar esportes com pills |

