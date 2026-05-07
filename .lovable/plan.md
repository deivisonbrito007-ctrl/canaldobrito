## Problema

Canais órfãos como "Globo HD", "Globo SP", "ESPN 2", "SporTV 3", "Premiere 2" aparecem em **Sem logo** mesmo já existindo um mapping principal ("Globo", "ESPN", "SporTV", "Premiere"). A logo seria a mesma — falta apenas registrar como alias.

Hoje o admin precisa: abrir modal do mapping principal → expandir aliases → digitar manualmente. Repetir para cada variante.

## Solução: sugestão automática de vínculo

### 1. Hook `useChannelMatchSuggestion`
Para cada órfão, encontra o melhor candidato entre `mappings` + built-ins, usando heurísticas em ordem:

1. **Prefixo forte**: órfão começa com nome de mapping (ex: "globo-hd" começa com "globo") → confiança **alta**.
2. **Substring**: nome do mapping está contido no órfão (ex: "tv-globo-sp" contém "globo") → confiança **média**.
3. **Token comum + número**: órfão = mapping + sufixo numérico/UF (`hd|sd|4k|sp|rj|2|3|plus|\+`) → confiança **alta**.
4. **Levenshtein ≤ 2** sobre normalized → confiança **baixa** (só sugere, não auto-vincula).

Retorna `{ mapping, confidence: 'high' | 'medium' | 'low' }` ou `null`.

### 2. UI no card de órfão (aba "Sem logo")

Quando há sugestão:

```text
┌─────────────────────────────────────────┐
│ Globo HD              detectado 12x     │
│ ⚠ Sem logo                              │
│                                         │
│ 💡 Parece variante de [Globo] (logo ✓) │
│ [ Vincular como alias de Globo ]        │
│ [ Cadastrar como canal novo ]           │
└─────────────────────────────────────────┘
```

- Botão primário "Vincular como alias" → insere em `channel_aliases` com 1 clique, sem abrir modal.
- Botão secundário mantém fluxo atual (novo mapping).

### 3. Ação em massa: "Auto-vincular"

Acima da grade de órfãos, novo botão:

```text
[ ✨ Auto-vincular N variantes detectadas ]
```

Roda apenas em órfãos com confiança **alta**. Pré-visualiza em modal:

```text
Vincular como alias:
  • Globo HD       → Globo
  • Globo SP       → Globo
  • ESPN 2         → ESPN
  • SporTV 3       → SporTV
  • Premiere 2     → Premiere
[ Confirmar 5 ] [ Cancelar ]
```

Após confirmar: `INSERT` em batch em `channel_aliases`, invalida `CHANNEL_ALIASES_QK` + `CHANNEL_MAPPINGS_QK` + `discovered-channels`. Os canais saem da lista de órfãos automaticamente (o `useChannelMappings` já merge aliases no Map).

### 4. Indicação no StatCard

Mudar o card "Sem logo" para mostrar sub-rótulo quando houver sugestões:

```text
Sem logo: 8
↳ 5 prováveis variantes
```

### 5. Built-ins também contam

Hoje built-ins (Globo, ESPN, SporTV, Premiere, DAZN, etc.) não têm linha em `channel_logo_mappings` por padrão. Para vincular alias a um built-in, o auto-vínculo precisa **primeiro criar o mapping principal** (logo_key correspondente, active:true) e em seguida o alias. Faço isso transparente — o usuário só vê "vinculado a Globo".

## Arquivos a alterar

- **novo**: `src/hooks/useChannelMatchSuggestion.ts` — heurísticas + retorna sugestões.
- `src/pages/admin/AdminCanaisLogos.tsx`:
  - `ChannelCard`: receber `suggestion`, renderizar botão "Vincular como alias" no estado órfão.
  - Nova mutation `linkAsAlias(orphan, targetMapping)`.
  - Novo botão de bulk auto-vincular + AlertDialog de preview.
  - StatCard "Sem logo" com sub-contagem.
- **novo**: `src/components/admin/AutoLinkPreviewDialog.tsx` — lista a aplicar.
- **novos testes**:
  - `src/hooks/__tests__/useChannelMatchSuggestion.test.ts` — cobre sufixos HD/SP/2/3, prefixo, Levenshtein, sem match.
  - `src/pages/admin/__tests__/AdminCanaisLogos.autolink.test.tsx` — render do botão "Vincular como alias", confirmação do bulk preview.

## Sugestões extras (opcionais)

1. **Modo "sempre auto"**: setting `auto_link_high_confidence_orphans=true` que roda no save do parser e silenciosamente cria aliases para variantes claras (Globo HD, ESPN 2). Reduz alertas no admin sem intervenção.
2. **Whitelist de sufixos**: tabela `channel_variant_suffixes` (`hd, sd, 4k, sp, rj, mg, 2, 3, plus`) administrável, em vez de hardcoded.
3. **Botão "Ignorar variante"** no card: marca como "não é variante" (cria mapping com `logo_key='none'`) — fluxo já existe via "Silenciar", só precisa aparecer junto da sugestão.
4. **Histórico de auto-vínculos** em `audit_logs` (action=`auto_link_alias`) para auditar falsos positivos.

Confirma seguir com itens 1–5 (núcleo)? Se quiser, já incluo a sugestão extra **#1 (auto-link no parser)** ou **#3 (botão ignorar)** no mesmo passe — só avisar.
