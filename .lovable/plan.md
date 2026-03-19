

# Corrigir Labels dos Badges — Seção Novidades

## Problema
Os 5 tipos de badge já existem no código do admin e da home, mas:
1. Na **home pública**, o tipo `novidade` mostra **"🔥 Em Alta"** em vez de **"🔥 Novidade"**
2. Na **lista do admin**, os labels usam abreviações difíceis de ler ("Nov.", "Lanç.", "Nova Temp.")

Não é necessário adicionar "Novo Conteúdo" — o usuário quer apenas que os 5 tipos existentes funcionem e apareçam corretamente.

## Correções

### `src/components/public/NewsReleasesSection.tsx` (linha 127)
- Trocar o label default de `"🔥 Em Alta"` para `"🔥 Novidade"`

### `src/pages/admin/AdminNovidades.tsx` (linhas 147-150)
- Trocar abreviações por labels completos na lista de itens:
  - "Lanç." → "Lançamento"
  - "Nova Temp." → "Nova Temporada"  
  - "Nov." → "Novidade"

Total: **2 arquivos**, correções pontuais de texto.

