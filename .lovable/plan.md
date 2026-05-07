## Auditoria — Aba Admin → Auditoria

### Como funciona hoje
- Página: `src/pages/admin/AdminAudit.tsx` (rota `/admin/audit`).
- Lê `audit_logs` via `useQuery` (limite 200, refetch 30s).
- Filtros: apenas dois chips ("Tudo" / "Removidos manuais").
- RLS: somente admins leem (`has_role`); inserts feitos por triggers/edge functions.

### Estado real no banco (verificado)
- `delete_api` × 427 — entity `daily_games`
- `delete_manual` × 63 — entity `daily_games`
- `api_live_update_run` × 27 — entity `daily_games`
- `api_sync_run` × 11 — entity `daily_games`
- `api_sync_resumed` × 1 — entity `settings`
- A maioria tem `actor_id` nulo (sistema/edge function).

### Problemas encontrados

**Bugs / Tipagem**
1. `payload: any` e cast `from("audit_logs" as any)` — mas a tabela está nos tipos gerados; cast não é necessário.
2. Filtros não cobrem `api_sync_run`, `api_sync_failed`, `api_live_update_run`, `api_sync_resumed/paused` — só "delete_manual".
3. Limite 200 sem aviso.
4. `actor_id` nulo é renderizado como "actor: —" — deveria mostrar "sistema" para evitar confusão.
5. Sem tratamento de erro de query (silencioso).

**Mobile (320–430px)**
6. Chips com `text-[10px] px-2.5 py-1` — abaixo do mínimo 44px.
7. Container `max-w-3xl` ✓, mas faltam safe areas (`env(safe-area-inset-bottom)`).
8. `max-h-[600px]` interno cria nested scroll que conflita com o scroll da página no mobile — melhor deixar a lista crescer.
9. Sem busca/filtro por texto (essencial em 200+ registros — atual: 528 no banco).

**UX**
10. Sem botão "Atualizar" manual, "Exportar CSV", nem stats agregadas.
11. Sem timestamp relativo ("há 2min") — só absoluto, dificulta scanning.
12. Payload JSON nunca visível — registros como `delete_api` mostram só o badge sem dados.
13. Sem agrupamento visual entre eventos por dia.
14. Skeleton ausente — mostra "Carregando…" texto puro.
15. `actor_id` truncado sem ação para copiar UUID completo.

### Plano de melhorias

#### A. Tipagem & Robustez
- Remover `any` (usar tipo `Json` gerado).
- Tratar erro: mostrar toast em falha.
- Aumentar limite para 500 + banner "limite atingido".

#### B. Filtros & Busca
- **Busca livre** por payload/actor/action/entity.
- **Select de Ação** com todas as ações reais (geradas dinamicamente do dataset com contagem).
- **Select de Entidade** (geradas do dataset com contagem).
- **Presets de período**: 24h / 7d / 30d / Tudo (gte `created_at`).

#### C. Stats & UX
- 3 pills: Remoções / Sync runs / Falhas (do dataset filtrado).
- Botões 44px: **Atualizar** (com spinner) e **Exportar CSV**.
- Timestamp relativo "há Xmin" (com title=absoluto), atualiza a cada 30s via refetch.
- Cada linha: chevron expande **payload JSON** completo em `<pre>` formatado.
- Botão **copiar actor_id** completo.
- Skeleton shimmer durante loading.
- Renderizar `actor_id` nulo como "sistema" (não "—").
- Quebrar linha para mensagens de erro (`break-words`).
- Adicionar metadata para `api_live_update_run`, `api_sync_failed`, `api_sync_paused/resumed` (já tinha alguns; completar).

#### D. Mobile
- Container com `pb-[calc(env(safe-area-inset-bottom)+1.5rem)]`.
- Botões/chips/inputs com `min-h-11`.
- Remover `max-h-[600px]` (deixar fluir).
- `overflow-x-auto` no `<pre>` do JSON expandido.

#### E. Verificação
- Rodar `bunx vitest run` — esperar 331/331.
- Browser test em viewport 390×844 e 320×568 verificando: presets, busca, expand JSON, export CSV, stats, sem overflow.

### Sugestões adicionais (fora do escopo se priorizar)
- **Realtime via Supabase channel** em `audit_logs` para inserts aparecerem sem polling.
- **Histórico de mudanças de RLS/role**: hoje só captura `daily_games`/`settings`. Trigger genérica para `user_roles` ajudaria em compliance.
- **Detalhar diff** quando `payload.previous` + `payload.new` existirem (settings) — render lado a lado.
- **Agrupamento por dia** com sticky day header (`07/05 · 14 eventos`).

---

Posso seguir com **A + B + C + D** numa única passada?
