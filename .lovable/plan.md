

## Correção: Programação não publica

### Problema
Na função `buildInsertPayload` (linha 563 de `ProgramacaoTexto.tsx`), o campo `dateBumped` (usado apenas na UI para indicar jogos de madrugada com data avançada) **não é removido** antes do insert no banco. Como `dateBumped` não existe como coluna na tabela `daily_games`, o insert falha.

A linha atual desestrutura apenas `selected` e `sport_type`:
```js
({ selected: _, sport_type: parsedSport, ...g }) =>
```
Mas `dateBumped` permanece no spread `...g` e é enviado ao banco.

### Correção

**Arquivo:** `src/components/admin/ProgramacaoTexto.tsx`, linha 563

Adicionar `dateBumped` na desestruturação:
```js
({ selected: _, sport_type: parsedSport, dateBumped: _bump, ...g }) =>
```

Isso remove o campo antes de montar o payload de insert, resolvendo o erro.

### Validação
- Rodar `vitest run` para confirmar 0 regressões.

