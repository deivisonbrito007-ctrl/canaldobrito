# Corrigir horário 00:00 e "Sem competição" ao gerar texto do banner

## O que está acontecendo (verificado no código)

Nos cards da imagem ("Atletismo / 13h00", "Ginástica Artística / 14h30") o horário aparece como 00:00 e sai o aviso "Sem competição". Causa confirmada em `src/components/admin/ProgramacaoTexto.tsx`:

- A linha 1 do evento veio no formato compacto `Nome / 13h00` (nome + horário juntos). O parser trata a linha 1 apenas como nome do evento/times — ele só extrai horário das linhas de metadados (`⏰` / `🏆 Comp / ⏰ HHhMM`).
- Como o evento só tinha `📺 SporTV 3` depois, não houve linha de competição nem de horário: `game_time` fica no default `"00:00"` e `competition` fica vazio, disparando os dois avisos em `getGameWarnings` (linhas 718-722).
- "Ginástica Artística" foi classificada como Futebol porque `detectSportType` não conhece ginástica e cai no fallback `football`.

Ou seja: o texto gerado pela IA não seguiu o formato de 3 linhas, e o parser não tem tolerância para esse formato compacto.

## Correções

### 1. Parser tolerante ao formato compacto (principal)
Em `ProgramacaoTexto.tsx`:
- Ao montar um evento, se nenhum horário foi encontrado nos metadados, procurar `HHhMM` / `HH:MM` no final da linha 1 (`Atletismo / 13h00`, `Atletismo - 13h00`, `Atletismo 13h00`), usar como `game_time` e removê-lo do nome do evento.
- Se `competition` ficar vazia, herdar o rótulo do esporte da seção atual (ex.: seção 🏃 ATLETISMO → competição "Atletismo") em vez de deixar vazio.
- Manter o aviso "Horário 00:00" apenas quando realmente não houver horário em nenhum lugar.

### 2. Novo esporte: ginástica
Em `src/lib/gameUtils.ts`: adicionar `gymnastics` (emoji 🤸, rótulo "Ginástica", duração ~180 min, evento único) e detecção por "ginástica", "artística", "rítmica", "FIG". No parser, reconhecer cabeçalho 🤸.

### 3. Endurecer o prompt-modelo
Em `BANNER_PROMPT_MODEL` (`src/pages/admin/AdminBanners.tsx`) e `docs/prompts/banner-from-image.md`:
- Regra explícita: o horário **nunca** vai na linha 1; a linha 1 é só o nome do evento/confronto.
- Regra explícita: a linha 2 (`<emoji> Competição / ⏰ HHhMM`) é obrigatória em todo evento, mesmo em evento único — se não houver competição nomeada, repetir o nome do esporte (ex.: `🏃 Atletismo / ⏰ 13h00`).
- Acrescentar exemplo de evento único correto/incorreto (o caso "Atletismo / 13h00" como ❌).
- Incluir 🏃 Atletismo, 🤸 Ginástica, 🤾 Handebol, 🎮 eSports na tabela de emojis.

### 4. Testes
Casos novos em `src/components/admin/__tests__/sports_parser.test.ts`: linha compacta `Atletismo / 13h00` + `📺 SporTV 3` deve gerar horário 13:00, competição "Atletismo" e esporte atletismo; `Ginástica Artística / 14h30` deve virar ginástica.

## Detalhes técnicos
Arquivos: `src/components/admin/ProgramacaoTexto.tsx` (extração de horário na linha de título, herança de competição, cabeçalho 🤸), `src/lib/gameUtils.ts` (tipo `gymnastics` + detecção), `src/pages/admin/AdminBanners.tsx` (prompt-modelo), `docs/prompts/banner-from-image.md`, testes do parser. Sem migração de banco.
