# Hardening do redirect `/agenda` → `/programacao`

Hoje o `AgendaRedirect` em `src/App.tsx` já faz `Navigate` para `/programacao${window.location.search}`, mas não valida nada — qualquer string passa adiante, e parâmetros inválidos podem quebrar a `ProgramacaoTab` (por exemplo `?date=hoje` ou `?date=2026-13-40`).

A proposta é transformar esse redirect em um componente robusto, com validação explícita de `date`, preservação garantida de UTMs e de parâmetros conhecidos, e descarte seguro do resto.

## O que muda

### 1. Novo helper `src/lib/agendaRedirect.ts`

Função pura `buildProgramacaoRedirect(search: string, hash: string): string` que:

- Faz parse com `URLSearchParams`.
- Valida `date`:
  - Aceita somente formato `YYYY-MM-DD` via regex `^\d{4}-\d{2}-\d{2}$`.
  - Confere se é uma data real (`new Date(...)` + checagem de componentes).
  - Se inválido → remove o param (cai no default = hoje na `ProgramacaoTab`).
- Preserva, sem alteração, a allowlist:
  - `date`
  - `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
  - `ref`, `src` (já usados em compartilhamentos)
  - `tab` (mapeado via `SLUG_TO_TAB` se presente; fallback `schedule`)
- Descarta silenciosamente qualquer outra chave (evita que params órfãos da rota antiga vazem).
- Retorna `/programacao` + querystring reconstruída + `hash` original (se existir).

### 2. `AgendaRedirect` em `src/App.tsx`

Substituir o componente atual por uma versão que:

- Lê `useLocation()` (em vez de `window.location`) para SSR-safety e consistência com o React Router.
- Chama `buildProgramacaoRedirect(location.search, location.hash)`.
- Renderiza `<Navigate to={target} replace />`.

### 3. Telemetria leve (opcional, mesmo arquivo)

Antes do `Navigate`, dispara um `window.dispatchEvent(new CustomEvent("legacy-agenda-redirect", { detail: { from, to } }))` para que o pipeline de analytics existente possa registrar quantos acessos ainda chegam por `/agenda`. Sem custo se nada estiver escutando.

### 4. Cobertura de testes

Adicionar `src/lib/__tests__/agendaRedirect.test.ts` com casos:

- `?date=2026-05-20` → preservado.
- `?date=invalida` → removido.
- `?date=2026-13-40` → removido.
- `?utm_source=wa&utm_campaign=x&date=2026-05-20` → todos preservados, ordem irrelevante.
- `?foo=bar&date=2026-05-20` → `foo` descartado.
- `#secao` → hash preservado.
- string vazia → `/programacao`.

## Detalhes técnicos

```text
/agenda?date=2026-05-20&utm_source=wa&foo=bar#x
        │
        ▼
buildProgramacaoRedirect()
        │
        ▼
/programacao?date=2026-05-20&utm_source=wa#x
```

- Sem alteração em `ProgramacaoTab`, `BottomNav`, `Index`, `whatsappText` ou templates do admin — a contract da nova URL continua a mesma já consumida hoje.
- Sem mudanças em rotas: apenas o componente de `/agenda` é trocado.
- 100% client-side; nenhum impacto em SEO além do `replace` que evita poluir o histórico.

## Arquivos tocados

- `src/lib/agendaRedirect.ts` (novo)
- `src/lib/__tests__/agendaRedirect.test.ts` (novo)
- `src/App.tsx` (substituir `AgendaRedirect`)

## Fora de escopo

- Redirect server-side (Lovable já serve SPA fallback; o redirect client-side é suficiente).
- Mudanças visuais na `ProgramacaoTab`.
- Limpeza dos componentes órfãos da antiga aba "Ao Vivo" (pendente de decisão sua em mensagem anterior).
