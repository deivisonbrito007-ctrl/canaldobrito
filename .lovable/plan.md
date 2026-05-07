## Auditoria da aba Admin → Canais & Logos

Fluxo revisado: `AdminCanaisLogos.tsx`, `ChannelLogoUpload.tsx`, `ChannelPreviewStage.tsx`, `useChannelMappings.ts`, `useDiscoveredChannels.ts`. Tabela `channel_logo_mappings` com RLS de admin OK, bucket `channel-logos` público OK.

### Problemas encontrados

1. **A11y**: o `DialogContent` "Editar/Novo mapeamento" não tem `DialogDescription` → warning no console (`Missing Description or aria-describedby`).
2. **Mobile (≤430px)**:
   - Header com "Detectar agora" + "Novo" estoura em telas estreitas.
   - `TabsList` com 4 abas (`Sem logo / Todos / Personalizados / Built-in`) + `Input` de busca colado ao lado quebra mal; tabs ficam cortadas, busca vira full-width sem rótulo.
   - Botões grip / ações com `h-7 w-7` ficam abaixo do mínimo 44px de toque.
   - Modal com `flex-col sm:flex-row` no footer empurra "Excluir" pro topo no mobile — ordem fica confusa.
3. **UX**:
   - `confirm()` nativo (3 lugares) bloqueia, não combina com tema dark e quebra no iOS PWA → trocar por `AlertDialog`.
   - "Detectar agora" não mostra loading; se `isFetching`, deveria spinar.
   - Busca não filtra pelo nome normalizado (ex: digitar "band sports" não acha "BandSports").
   - Toggle "Fundo claro" não tem preview imediato no chip do form.
   - Sem ação em massa para canais sem logo (ex: marcar todos como `none + ativo` para sair da fila).
   - Built-in lista todos sempre, sem indicador de quantos já têm jogos detectados nos últimos 30d.
   - `key={previewChannel}` no `ChannelPreviewStage` desmonta tudo a cada clique no olhinho — perde os campos digitados ali.
4. **Performance**: `reorder` dispara N `UPDATE` em paralelo. Para >20 itens, melhor um RPC `reorder_channel_mappings(uuid[])`.
5. **Testes**: nenhum teste para `AdminCanaisLogos`, `ChannelLogoUpload`, `useDiscoveredChannels`. `ChannelBadge` já tem.

### Plano de implementação

**1. UX / A11y do modal**
- Adicionar `DialogDescription` ao Dialog (some o warning).
- Trocar `confirm(...)` por `AlertDialog` com tema (3 ocorrências: delete row, delete card, delete dentro do modal).
- Footer do modal: ordem `[Excluir | Cancelar | Salvar]` → empilhar como `[Salvar, Cancelar, Excluir]` no mobile (Salvar primeiro = polegar).
- Toggle "Fundo claro" injetar preview ao vivo (já temos, só precisa reagir ao `light_chip` via prop opcional no `ChannelBadge` quando custom).

**2. Mobile-first**
- Header: empilhar verticalmente <sm e usar botões `flex-1` (Detectar / Novo).
- `TabsList`: usar scroll horizontal com `overflow-x-auto`, badges menores, e mover busca para LINHA SEPARADA com ícone embutido.
- Botões de ação dos cards: subir para `h-9 w-9` (≥36px com padding interno alcança 44px).
- Grip handle do dnd: aumentar área de toque com `p-3 -m-2`.
- Garantir `safe-area-inset-bottom` no footer do Dialog (já fica acima por causa do max-h, ok, mas adicionar `pb-[env(safe-area-inset-bottom)]`).

**3. Funcionalidades**
- "Detectar agora": usar `discovered.isFetching` para girar o ícone + desabilitar.
- Busca: incluir `normalizeChannelName(query)` no filtro.
- Bulk action na aba "Sem logo": botão "Marcar X como sem logo (silenciar alerta)" criando mapping com `logo_key='none', active:true`.
- Trocar `key={previewChannel}` por prop controlada no `ChannelPreviewStage` (`value`/`onChange`).
- "Detectados (30d)" na StatCard vira clicável → muda pra aba `all`.

**4. Backend**
- Migration: criar `public.reorder_channel_mappings(_ids uuid[])` `SECURITY DEFINER` chequeando `has_role(auth.uid(),'admin')` e atualizando `sort_order` em batch.
- Substituir o loop de updates por `supabase.rpc('reorder_channel_mappings', { _ids: orderedIds })`.

**5. Testes (vitest)**
- `useDiscoveredChannels.test.ts`: agrupa por normalized, conta ocorrências, marca isOrphan/isBuiltin corretamente (mockando supabase).
- `ChannelLogoUpload.test.tsx`: rejeita tipo inválido, rejeita >400KB, dispara `onUploaded` no sucesso (mock supabase.storage).
- `AdminCanaisLogos.test.tsx`: render básico, troca de tab, busca filtra, abre modal "Novo", abre modal de edição com prefill.
- Rodar suíte completa via vitest e reportar resultados.

**6. Linter / Auditoria final**
- Rodar `supabase--linter` para confirmar que nada novo foi introduzido com a nova função RPC.
- Rodar testes com vitest.
- Smoke test no preview mobile (390x844) via browser.

### Arquivos afetados
- `src/pages/admin/AdminCanaisLogos.tsx` (refactor UX/mobile, AlertDialog, DialogDescription, RPC reorder, busca normalizada, bulk action, header responsivo).
- `src/components/admin/ChannelPreviewStage.tsx` (props controladas).
- `src/components/admin/ChannelLogoUpload.tsx` (a11y label + safe area).
- `src/components/public/ChannelBadge.tsx` (suporte a `forceLightChip` no preview do form — já existe, só usar).
- Nova migration: `reorder_channel_mappings` RPC.
- Novos testes: `src/hooks/__tests__/useDiscoveredChannels.test.ts`, `src/components/admin/__tests__/ChannelLogoUpload.test.tsx`, `src/pages/admin/__tests__/AdminCanaisLogos.test.tsx`.

### Sugestões extras (opcionais, não no escopo a menos que aprove)
- Exportar/importar mapeamentos como JSON (backup).
- Auditoria: registrar em `audit_logs` quando mapping é criado/editado/removido (trigger).
- Aviso no card quando custom_logo_url retorna 404 (HEAD check com cache curto).
- Atalho de teclado `n` para abrir "Novo" nessa página.

Confirma que sigo com tudo de 1 a 6? Se quiser cortar algo (ex: pular RPC e manter loop atual), me avisa.
