## Objetivo

Hoje já existe `/admin/canais-logos` com upload, mapeamento, detecção automática de órfãos e preview do `ChannelBadge` em três tamanhos. Falta o que você pediu agora: **ordenar canais** e **ver como ficam no carrossel e na programação real**, sem sair do admin.

## O que vou entregar

### 1. Ordenação dos canais (drag-and-drop)
- Migração: adicionar `sort_order integer not null default 0` em `channel_logo_mappings` + índice.
- UI: na aba **Personalizados** (única que faz sentido ordenar), grid vira lista arrastável com `@dnd-kit/sortable` (já bate com o padrão do projeto). Cada card mostra um handle ⋮⋮ à esquerda.
- Salvamento: ao soltar, atualiza `sort_order` em lote (uma chamada `upsert`) e invalida `CHANNEL_MAPPINGS_QK`.
- A ordem influencia onde houver lista de canais (ex.: badges em GameCard quando há vários canais para o mesmo jogo). Hoje a ordem vem do array do parser; passamos a reordenar usando o `sort_order` quando houver mapping.

### 2. Preview ao vivo no carrossel e na programação
Nova seção **"Como vai aparecer"** abaixo do "Teste de matching", com 3 abas:

```
[ Chip puro ]  [ Card da Programação ]  [ Carrossel ao vivo ]
```

- **Chip puro**: o que já existe (sm/md/lg lado a lado).
- **Card da Programação**: monta um `GameCard` fake (Flamengo x Palmeiras, 21:30, hoje) injetando o canal selecionado no array `channels`. Reaproveita o componente real, então qualquer mudança visual aparece automaticamente.
- **Carrossel ao vivo**: renderiza o trecho do `LiveNowSection` (versão isolada com 1 jogo mock) usando o mesmo `ChannelBadge size="sm"`. Mostra como fica no glassmorphism dos cartões "AO VIVO".

Cada aba tem um seletor de canal no topo (autocomplete com a lista de mappings + órfãos), assim você pode testar qualquer canal — incluindo um recém-cadastrado — sem precisar abrir um jogo real.

### 3. Atalho contextual
- No card de cada canal (todas as abas), botão extra **"Ver na programação"** que abre direto a aba de preview já com aquele canal selecionado.

## Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/migrations/<novo>.sql` | `ALTER TABLE channel_logo_mappings ADD COLUMN sort_order` + índice |
| `src/hooks/useChannelMappings.ts` | incluir `sort_order` no tipo |
| `src/pages/admin/AdminCanaisLogos.tsx` | adicionar drag-and-drop + nova seção de preview com 3 abas |
| `src/components/admin/ChannelPreviewStage.tsx` (novo) | mock do GameCard + mini LiveNow para preview isolado |
| `src/components/public/schedule/GameCard.tsx` | usar `sort_order` quando houver mapping (ordenação estável dos badges) |
| `package.json` | adicionar `@dnd-kit/core` + `@dnd-kit/sortable` se ainda não estiverem |

## Observações
- Mantém todo o sistema atual (auto-discovery, upload, fundo claro, abreviação) — é só adição.
- Sem mudanças em RLS: `sort_order` segue as políticas existentes da tabela.
- Mobile-first preservado: drag-and-drop com long-press de 250ms para não conflitar com scroll.
- Acessibilidade: handle do drag tem `aria-label` e suporta teclado (setas) via `@dnd-kit`.

Posso aplicar agora se aprovar.