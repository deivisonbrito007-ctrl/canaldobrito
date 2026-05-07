## Admin de Canais & Logos — versão profissional

Hoje o admin (`/admin/canais-logos`) só permite mapear nomes para logos já embutidas no código. Vou transformá-lo num **painel central** que:

1. Lista **todos** os canais conhecidos (built-in + DB + descobertos automaticamente nos jogos).
2. Detecta canais novos vindos do parser do WhatsApp e mostra um alerta "X canais sem logo".
3. Permite **fazer upload de uma logo nova direto pela tela** (sem precisar mexer no código).
4. Mantém preview ao vivo do `ChannelBadge` para cada canal.

---

### 1. Storage para logos enviadas pelo admin

Criar bucket público `channel-logos` com policies:
- SELECT: público
- INSERT/UPDATE/DELETE: apenas `has_role(auth.uid(),'admin')`

### 2. Migração do schema

Adicionar à tabela `channel_logo_mappings`:
- `custom_logo_url text` — URL pública da logo enviada pelo admin (quando preenchida, tem prioridade sobre `logo_key`).
- `light_chip boolean default false` — força fundo branco no chip se a logo for escura.
- Índice único em `name_normalized`.

### 3. Auto-descoberta de canais

Novo hook `useDiscoveredChannels()` que:
- Busca `daily_games.channels` (array) dos últimos 30 dias.
- Faz `flat()` + `normalizeChannelName()` para deduplicar.
- Cruza com built-in + mappings do DB.
- Retorna 3 listas: **mapeados**, **built-in**, **órfãos** (canais que aparecem nos jogos mas caem no fallback 📺).

### 4. UI do `AdminCanaisLogos` reformulada

```text
┌─ Canais & Logos ─────────────────────────────┐
│ [stats] 42 mapeados · 9 órfãos · 23 built-in │
│ ⚠️ 9 canais novos no sistema sem logo →     │
├──────────────────────────────────────────────┤
│ [🔍 Teste de matching] preview live          │
├──────────────────────────────────────────────┤
│ Tabs: [Todos] [Órfãos] [Personalizados]     │
│       [Built-in]                             │
├──────────────────────────────────────────────┤
│ Grid responsivo de cards. Cada card:        │
│   ┌────────────────────────────┐            │
│   │ [logo 48x48] Nome do canal │            │
│   │ Aparece em N jogos · DB    │            │
│   │ [Editar] [Upload logo]     │            │
│   └────────────────────────────┘            │
└──────────────────────────────────────────────┘
```

**Modal de edição** (substitui o atual):
- Campo: nome do canal (com normalizado abaixo).
- **Tabs internos**:
  - **Logo do registry**: select com preview de cada logo built-in (atual).
  - **Upload personalizado**: dropzone + input file → envia para `channel-logos/<slug>.png` no Storage e salva URL em `custom_logo_url`. Mostra preview imediato.
- Switch "Fundo claro" (lightChip).
- Campo abreviação opcional.
- Switch ativo/inativo.
- **Preview live** do `ChannelBadge` em sm/md/lg lado a lado.
- Botões: Cancelar · Salvar · (se editando) Excluir.

**Card de órfão** tem botão de atalho **"Adicionar logo"** que abre o modal já com o nome preenchido e foco na aba Upload.

### 5. ChannelBadge: suportar `custom_logo_url`

Em `useChannelMappings` incluir `custom_logo_url` e `light_chip`. No `ChannelBadge`, prioridade:
1. `custom_logo_url` do DB (se houver) → renderiza `<img>` direto.
2. `logo_key` do DB → registry.
3. Built-in `CHANNEL_MAP[logoKey]`.
4. Fallback emoji.

Mantém o wrapper padronizado (mesma classe `ICON_WRAP` da última iteração) para garantir alinhamento entre logos do registry e logos enviadas.

### 6. Atalho na barra do admin

Adicionar badge vermelho com contador no item "Canais" do `AdminLayout` quando houver órfãos (`useDiscoveredChannels().orphans.length > 0`).

---

### Detalhes técnicos

- **Arquivos**:
  - `src/pages/admin/AdminCanaisLogos.tsx` — refeito.
  - `src/hooks/useDiscoveredChannels.ts` — novo.
  - `src/hooks/useChannelMappings.ts` — adiciona `custom_logo_url`, `light_chip` ao tipo.
  - `src/components/public/ChannelBadge.tsx` — branch para custom URL.
  - `src/components/admin/ChannelLogoUpload.tsx` — dropzone reutilizável (sanitize do nome → slug, valida ≤ 200 KB, força PNG/SVG/WEBP, sobe via `supabase.storage.from('channel-logos').upload`).
  - `src/pages/AdminLayout.tsx` — badge de pendências.
  - Migração: ALTER TABLE + bucket + policies.
- **Validações no upload**: tipo `image/png|svg+xml|webp`, tamanho máximo 300 KB, dimensão sugerida 200x200, gera nome `<slug>-<timestamp>.<ext>` para invalidar cache.
- **React Query**: invalida `CHANNEL_MAPPINGS_QK` e `["channel_logo_mappings_admin"]` após qualquer escrita; mostra toasts.
- **Acessibilidade**: dropzone aceita teclado (Enter abre file picker), `aria-label` em tudo, foco volta para o card editado ao fechar modal.

### Sugestões extras (opcionais, posso incluir se aprovar)
- **Botão "Detectar agora"** que força refetch dos jogos.
- **Exportar/Importar JSON** dos mapeamentos para backup.
- **Drag-and-drop** entre cards para reordenar prioridade quando houver duplicatas.
- **Sugerir logo via IA** (Lovable AI Gateway com `gemini-2.5-flash-image`) gerando placeholder estilizado quando o admin não tem PNG oficial.

Posso aplicar com ou sem essas sugestões — me diga se quer alguma e eu já implemento tudo de uma vez.