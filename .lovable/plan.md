

## Corrigir detecção de esportes — falsos positivos e emojis faltando

### Problemas encontrados

1. **Nomes de times ambíguos no `detectSportType`** — palavras como "Rangers", "Giants", "Cardinals", "Blues", "Jets", "Stars", "Reds" existem tanto no hóquei/baseball quanto no futebol (Rangers FC, NY Giants NFL, etc.). Isso causa classificação errada.

2. **`detectSportFromEmoji` em ProgramacaoTexto.tsx** — faltam os emojis 🏒 (hockey) e ⚾ (baseball), então jogos colados com esses emojis não são detectados.

3. **`COMP_LINE_RE` em ProgramacaoTexto.tsx** — regex de linhas de competição não inclui 🏒 e ⚾, impedindo o parser de reconhecer essas linhas.

### Correções

**Arquivo 1: `src/lib/gameUtils.ts`**
- Remover nomes ambíguos das regexes de hockey e baseball (rangers, giants, cardinals, blues, jets, stars, reds, angels, nationals, athletics, wild, flames)
- Manter apenas nomes inequívocos (maple leafs, bruins, penguins, blackhawks, red wings, yankees, red sox, dodgers, cubs, mets, astros, etc.)
- Atualizar testes em `gameUtils.test.ts` para cobrir os novos esportes

**Arquivo 2: `src/components/admin/ProgramacaoTexto.tsx`**
- Adicionar `🏒` → `hockey` e `⚾` → `baseball` no `detectSportFromEmoji`
- Adicionar `🏒` e `⚾` na regex `COMP_LINE_RE`

### Detalhes técnicos

Times removidos por ambiguidade (existem em múltiplos esportes):
- `rangers` (NY Rangers hockey / Texas Rangers baseball / Rangers FC futebol)
- `giants` (SF Giants baseball / NY Giants football)
- `cardinals` (STL Cardinals baseball / AZ Cardinals football)
- `blues` (STL Blues hockey / Chelsea Blues futebol)
- `jets` (Winnipeg Jets hockey / NY Jets football)
- `stars` (Dallas Stars hockey / genérico)
- `reds` (Cincinnati Reds baseball / Nottingham Forest futebol)
- `angels` (LA Angels baseball / genérico)
- `nationals` (Washington Nationals baseball / genérico)
- `wild` (Minnesota Wild hockey / genérico)
- `flames` (Calgary Flames hockey / genérico)

Esses times serão detectados corretamente pelo `sport_type` salvo no banco, que é definido na hora do cadastro.

