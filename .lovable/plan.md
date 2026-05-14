# Fallback de `?date` inválido na Programação

O helper `buildProgramacaoRedirect` já valida o `date` no caminho `/agenda → /programacao`, mas a `ProgramacaoTab` é alcançada também por links diretos, deep-links salvos e o WhatsApp parser. Hoje, se a URL for `/programacao?date=lixo`, o componente faz `useAllDailyGames("lixo")` e o filtro de "ao vivo hoje" também falha. Precisa de uma camada defensiva no próprio componente.

## O que muda

### 1. Reusar a validação existente

`src/lib/agendaRedirect.ts` já exporta `isValidDateParam(value)`. Vou aproveitá-la — sem duplicação.

### 2. `ProgramacaoTab.tsx`

Substituir:

```ts
const date = params.get("date") || today;
```

por uma resolução validada:

```ts
const rawDate = params.get("date");
const date = rawDate && isValidDateParam(rawDate) ? rawDate : today;
```

E adicionar um `useEffect` que **limpa a URL** quando o param veio inválido:

- Se `rawDate` existe e não passa em `isValidDateParam`, chama `setParams(next, { replace: true })` removendo a chave `date`.
- `replace: true` evita poluir o histórico (o usuário não precisa "voltar" para a URL quebrada).
- UTMs e demais params permanecem intactos (apenas `date` é removido).

Resultado visível: a página abre normalmente em **hoje** (default correto da agenda) e a URL é normalizada para `/programacao` (ou `/programacao?utm_source=...` se houver UTMs).

### 3. Sem mudança em "dia mais próximo"

A interpretação literal de "dia mais próximo" seria buscar o próximo dia com jogos. Isso já é coberto pelo `EmptyDayState`, que oferece o botão "Ver amanhã" quando o dia escolhido está vazio. Cobrir isso de forma automática (auto-pular dias) seria uma mudança de UX maior e fora do escopo desta validação — é um redirect silencioso, não um "skip". Se você quiser esse comportamento, é uma feature à parte.

O fallback aqui cobre apenas **date inválido** → **hoje** (o "padrão correto" mencionado).

## Detalhes técnicos

```text
/programacao?date=lixo&utm_source=wa
        │
        ▼ (validação no mount)
/programacao?utm_source=wa            ← URL normalizada
hoje carregado em useAllDailyGames    ← UI consistente
```

- Idempotente: o `useEffect` só dispara se `rawDate` for inválido.
- Sem flicker: a primeira render já usa `today` porque a resolução acontece antes do `useAllDailyGames`.
- Sem impacto em `LiveHeroCard`, `SportSection`, ou outros consumidores — todos recebem `date` válido.

## Arquivos tocados

- `src/components/public/ProgramacaoTab.tsx` (validação + cleanup da URL)

## Fora de escopo

- Auto-skip para o "próximo dia com jogos" (mudança de UX).
- Mudanças no helper de redirect (já valida na rota `/agenda`).
- Validação no admin (deep-links admin não usam `?date` na Programação pública).
