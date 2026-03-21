
# Ajustes no Card Novidades

## Mudanças

### 1. Remover botões "Assistir agora" e "+ Minha lista"
Remover os dois botões tanto no layout mobile (linhas 190-197) quanto no desktop (linhas 213-220). O card já abre o `ContentDetailSheet` ao clicar, então os botões são redundantes.

### 2. Adicionar indicador de tipo de conteúdo (Filme / Série)
Usar o campo `content_type` que já existe nos dados para mostrar uma tag visual ao lado do badge. Exemplos:
- `🎬 Filme` para `content_type === "movie"`
- `📺 Série` para `content_type === "series"`

Será uma pill/tag pequena ao lado do badge existente, com estilo discreto (fundo transparente, borda sutil).

### 3. Adicionar metadata extra (ano, gênero)
Aproveitar os campos `year` e `genres` já disponíveis nos dados para mostrar uma linha de metadata abaixo do título. Exemplo: `2025 · Drama, Ação`. Isso dá mais contexto ao usuário sem precisar abrir o detalhe.

## Arquivo alterado
- `src/components/public/NovidadesCard.tsx`

## Resultado
Card mais limpo sem botões desnecessários, com informação clara se é filme ou série + ano e gênero visíveis.
