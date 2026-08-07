# Prompt + parser: identificação de esporte sem ambiguidade

## Problema

Hoje o esporte é adivinhado a partir do emoji da linha 2 e, quando o emoji é genérico, a partir do texto da competição. Isso gera dúvidas em três casos concretos, todos presentes no prompt atual:

- O prompt e o exemplo oficial usam `🏆 Copa do Mundo (Oitavas)`. O parser trata `🏆` como genérico (nenhum esporte) e cai no palpite por texto.
- `🥊` serve para Boxe **e** MMA — o parser também devolve "nenhum esporte" e adivinha pelo nome.
- `🏎️` cobre F1, MotoGP, Stock Car, Fórmula E, IndyCar, NASCAR — tudo virá como um único tipo, sem distinguir a categoria.

Além disso a competição/sessão vem escrita livremente ("Grande Prêmio da Chéquia", "MotoGP", "GP da Chéquia"), o que deixa cards inconsistentes.

## Solução

Tornar o esporte **explícito e legível por máquina**, em vez de deduzido, e padronizar o vocabulário da competição.

### 1. Tag de esporte obrigatória na linha 2

Novo formato da linha 2:

```text
<emoji> <Competição (Sessão/Fase)> / ⏰ HHhMM / #esporte
```

Exemplos:

```text
Brasil x Haiti
⚽ Copa do Mundo (Oitavas) / ⏰ 21h30 / #futebol
📺 SBT, Globo

Mateusz Gamrot x Quillan Salkilld
🥊 UFC Fight Night (Luta Principal) / ⏰ 21h00 / #mma
📺 Paramount+

MotoGP — GP da Grã-Bretanha (Classificação)
🏎️ MotoGP / ⏰ 07h50 / #motogp
📺 ESPN 4
```

Tags aceitas (uma por evento): `#futebol #futsal #basquete #volei #handebol #tenis #f1 #motogp #stockcar #formulae #indycar #nascar #mma #boxe #baseball #rugby #hoquei #surfe #ciclismo #golfe #natacao #atletismo #ginastica #esports`.

A tag manda; o emoji passa a ser só decoração. `🏆` é proibido como emoji de esporte.

### 2. Vocabulário fixo de competição e sessão

O prompt vai trazer a tabela de sessões canônicas por esporte (já existe parcialmente) e uma regra nova: a linha 2 leva o **nome curto oficial da competição** (`Brasileirão Série A`, `NBA`, `ATP 500`, `UFC Fight Night`, `LNF Futsal`, `World Surf League`), nunca a repetição do nome do evento da linha 1 e nunca o nome do estádio/cidade.

### 3. Parser lê a tag

Em `src/components/admin/ProgramacaoTexto.tsx`:

- nova função `parseSportTag(line)` que mapeia `#slug` → `SportType` (categorias de automobilismo colapsam em `f1`, que é o tipo existente, mas `competition_detail`/competição preserva a categoria);
- prioridade de detecção: **tag → emoji → texto da competição** (comportamento atual como último recurso, sem regressão para textos antigos);
- a tag é removida da competição e dos títulos em `parseCompAndTime`/`cleanText`, e o `/ #tag` extra não pode quebrar a leitura do horário;
- textos sem tag continuam funcionando exatamente como hoje.

### 4. Feedback no admin

Na lista de eventos parseados, mostrar a origem da classificação (`tag`, `emoji`, `texto`) num chip discreto, para o operador ver na hora qual evento foi adivinhado e corrigir. Nenhuma mudança de schema.

### 5. Testes

- novo teste com o texto do dia usando tags: `#mma` não vira boxe, `#futebol` com `🏆` classifica certo, `#ginastica`/`#atletismo` mantêm horário e competição;
- teste de retrocompatibilidade: o texto real de 08/08 (sem tags) continua passando.

## Detalhes técnicos

- Arquivos: `src/pages/admin/AdminBanners.tsx` (BANNER_PROMPT_MODEL), `docs/prompts/banner-from-image.md`, `src/components/admin/ProgramacaoTexto.tsx`, novo teste em `src/components/admin/__tests__/`.
- Sem migração de banco: `sport_type` continua o enum atual; a tag só melhora a precisão do preenchimento.
- Checklist final do prompt ganha os itens: "toda linha 2 termina com `#esporte`", "nenhum `🏆` usado como esporte", "nenhuma competição repetindo a linha 1".

## Sugestões extras (opcionais, digo antes de fazer)

- Botão "Validar texto" que lista eventos sem tag/sem horário antes de salvar.
- Aviso quando dois eventos tiverem o mesmo horário e mesmo confronto (duplicata da imagem).
