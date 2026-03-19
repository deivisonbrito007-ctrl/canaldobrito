

# Expandir Tipos de Badge na Seção Novidades

## Problema Atual
O admin só pode classificar itens como "Novidade" ou "Lançamento". Não há como marcar Nova Temporada, Estreia, Novo Conteúdo, etc.

## Solução
Adicionar mais opções de badge_type no admin e exibi-las corretamente na home.

### Novos tipos de badge:
| Valor | Label | Cor | Emoji |
|-------|-------|-----|-------|
| `novidade` | Novidade | Laranja | 🔥 |
| `lancamento` | Lançamento | Roxo | 🆕 |
| `nova_temporada` | Nova Temporada | Azul | 📺 |
| `estreia` | Estreia | Verde | ⭐ |
| `exclusivo` | Exclusivo | Dourado | 👑 |

### Arquivos a editar

**`src/pages/admin/AdminNovidades.tsx`**
- Expandir o `<Select>` de badge_type com as novas opções
- Atualizar o tipo do state `badgeType` para aceitar os novos valores
- Atualizar os badges visuais na lista de itens adicionados

**`src/components/public/NewsReleasesSection.tsx`**
- Atualizar o badge visual para renderizar corretamente todos os tipos (cores e labels)

**Nenhuma migração necessária** — o campo `badge_type` já é `text`, aceita qualquer valor.

