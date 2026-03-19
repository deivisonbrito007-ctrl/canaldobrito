

# Melhorar Descrição e Informações nas Novidades

## Situação Atual

Hoje o carousel de Novidades exibe: título, sinopse (overview), nota, ano, tipo (filme/série) e badge. Porém faltam informações úteis como **gêneros**, **duração** (filmes) ou **nº de temporadas** (séries), que o TMDB fornece mas não são capturadas.

## Proposta

### 1. Buscar dados detalhados do TMDB ao adicionar item

**Arquivo**: `supabase/functions/tmdb-proxy/index.ts`
- Adicionar 2 novas actions: `movie_details` e `tv_details` que chamam `/movie/{id}` e `/tv/{id}` do TMDB
- Estas retornam: gêneros (nomes), duração (runtime), nº de temporadas, tagline

### 2. Ampliar a tabela `news_releases`

**Migração SQL** — adicionar colunas:
- `genres` (text) — ex: "Ação, Aventura, Ficção"
- `runtime` (integer) — duração em minutos (filmes)
- `seasons` (integer) — nº de temporadas (séries)
- `tagline` (text) — frase de efeito do TMDB

Todas nullable para não quebrar dados existentes.

### 3. Capturar dados extras no admin ao adicionar

**Arquivo**: `src/pages/admin/AdminNovidades.tsx`
- Após o usuário clicar "Add", fazer uma segunda chamada ao TMDB (`movie_details` ou `tv_details`) para buscar gêneros, runtime/seasons e tagline
- Salvar esses dados nas novas colunas

**Arquivo**: `src/hooks/useNewsReleases.ts`
- Ampliar o tipo `NewsRelease` com os novos campos
- Atualizar o mutation de insert para incluí-los

### 4. Exibir informações enriquecidas no carousel público

**Arquivo**: `src/components/public/NewsReleasesSection.tsx`
- Exibir gêneros como pills/tags abaixo do título
- Mostrar duração (ex: "2h 15min") para filmes ou "X Temporadas" para séries
- Exibir tagline quando disponível, como texto em itálico acima da sinopse

## Resultado Visual (bottom do carousel)

```text
┌─────────────────────────────────────┐
│  🔥 Novidade              ⭐ 8.2   │
│                                     │
│  🎬 Filme · 2025 · 2h 15min        │
│  Ação · Aventura · Ficção           │
│  TÍTULO DO FILME                    │
│  "Tagline do filme aqui"            │
│  Sinopse resumida em 2 linhas...    │
│              ● ● ● ○ ○    2/5      │
└─────────────────────────────────────┘
```

## Arquivos a editar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/tmdb-proxy/index.ts` | Adicionar actions `movie_details` e `tv_details` |
| Migração SQL | Adicionar colunas `genres`, `runtime`, `seasons`, `tagline` |
| `src/hooks/useNewsReleases.ts` | Ampliar tipo e mutations |
| `src/pages/admin/AdminNovidades.tsx` | Buscar detalhes do TMDB ao adicionar |
| `src/components/public/NewsReleasesSection.tsx` | Exibir gêneros, duração/temporadas, tagline |

