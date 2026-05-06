## Auditoria — aba Filmes (admin)

**Estado atual** (`src/pages/admin/AdminFilmes.tsx` + `useMovies` + `useTMDB`):
- ✅ CRUD funciona: busca TMDB → add → toggle ativo → atualizar (1 ou batch) → deletar.
- ✅ Suíte de testes existente (`AdminFilmes.test.tsx`) com 5 testes — **todos passam** (rodei agora).
- ✅ Banco: 5 filmes, 5 ativos, 0 sem gênero, 0 sem backdrop. Saúde OK.

**Problemas encontrados:**

1. **Mobile <430px**: header "Adicionados" tem badge + 2 botões em linha única → quebra.
2. **Linha de filme**: `refresh + switch + delete` muito apertado (gaps 3, ícones 32-36px). Touch target abaixo do mínimo 44px da regra do projeto.
3. **`confirm()` nativo** para deletar — péssima UX no PWA iOS, fora do tema escuro.
4. **Sem feedback "nenhum resultado"** depois de buscar.
5. **Sem `aria-live`** na barra de progresso do batch.
6. **Sem skeleton** enquanto `useAllMovies` carrega (mostra "Nenhum filme adicionado" piscando).
7. **Filme já adicionado** continua com botão "Add" verde — confunde. Não há marca visual.
8. **Toggle/Delete não desabilitados** durante batch update — risco de race.
9. **Tabs sem `role=tab`** — acessibilidade.
10. **Stats**: mostra só "X ativos / Y" pequeno. Falta painel de saúde (total / ativos / nota média).

## O que vou fazer

**`src/pages/admin/AdminFilmes.tsx`** (rewrite mantendo lógica):
- Painel topo de stats: 3 cards (Total, Ativos, Nota média) — só aparece se houver filmes.
- Tabs com `role=tab` + `aria-selected`, `flex-1` no mobile (touch 44px).
- Input de busca com botão "limpar" (X), `enterKeyHint=search`, `inputMode=search`.
- Botão buscar desabilitado se query vazia.
- Card resultado TMDB ganha selo "✓" verde se já adicionado + botão "Adicionado" desabilitado.
- Estado vazio "Nenhum resultado" pós-busca.
- Header "Adicionados" com `flex-wrap` + label do botão encurta no mobile (`hidden xs:inline`).
- Linha do filme: poster maior (h-14 w-10), botões `h-11 w-11` (toque 44px), grupo `shrink-0`.
- Switch e botões desabilitados durante `batchActive`.
- Skeleton shimmer durante `isLoading` (3 linhas).
- `confirm()` → `<AlertDialog>` shadcn (tema escuro, dismissable).
- Progress com `role=status aria-live=polite`.
- Removo `console.log` de toggle/delete.

**Sugestões adicionais (não vou aplicar agora — pergunte se quer):**
- **A. Reordenação por drag** dos filmes ativos (define ordem no carrossel público) — coluna nova `display_order` + `@dnd-kit`. ~1h.
- **B. Filtro "só inativos / só sem gênero"** acima da lista. ~15min.
- **C. Busca com debounce** de 400ms, sem precisar clicar no botão. ~10min.
- **D. Sincronização por Realtime** (2 admins simultâneos veem alterações) — `supabase.channel('featured_movies')`. ~20min.
- **E. Bulk select** (checkboxes) para ativar/desativar/deletar vários de uma vez. ~30min.

## Arquivos afetados
- edit: `src/pages/admin/AdminFilmes.tsx`
- testes existentes continuam passando (mocks compatíveis); posso adicionar 2 testes a mais cobrindo `AlertDialog` de delete e selo "já adicionado" se quiser.

Aprova?