## Problema

O formulário novo de edição (e o de adicionar jogo manual) exige **os dois times**. Isso bloqueia eventos que não têm confronto "A x B": Kings League (rodada única), F1, UFC/MMA, surf, ciclismo, natação, golfe, tênis (torneio) e qualquer competição com formato diferente.

Confirmado no código:
- `DailyGamesManager.tsx` — validação do formulário inline: erro "Informe os dois times." quando `away_team` está vazio.
- `DailyGamesManager.tsx` — `AddGameForm`: `if (!home || !away || !time)` → "Preencha times e horário".
- `DailyGamesManager.tsx` — a lista sempre renderiza `{home} x {away}`, mostrando "Evento x " quando não há visitante.
- Em contraste, o resto do sistema **já suporta** evento único: o parser de WhatsApp cria jogos sem `away_team`, o formulário do parser tem placeholder "Time visitante (vazio = evento)", e os cards públicos (`GamePremiumCard`, `LiveHeroCard`, `HighlightsCarousel`) já usam `isVs = !!game.away_team`. Existe também o helper `isNonAdversarial(sport)` em `src/lib/gameUtils.ts` cobrindo f1, tênis, mma, surf, ciclismo, natação e golfe.

Ou seja: só o admin (edição/criação) está fora do padrão.

## O que muda

1. **Segundo time opcional**
   - Validação passa a exigir apenas: nome do evento/time da casa + horário válido.
   - Campo visitante ganha rótulo "(opcional)" e dica "deixe vazio para evento único".

2. **Formulário adaptativo por esporte**
   - Quando o esporte é não-adversarial (F1, MMA, surf, ciclismo, natação, golfe, tênis), os rótulos mudam para "Evento / prova" e o campo visitante fica recolhido atrás de um link "adicionar adversário" — sem sumir para quem precisar.
   - Para esportes de confronto, rótulos seguem "Time casa" / "Time visitante (opcional)".

3. **Modo evento explícito**
   - Um toggle "Evento único (sem confronto)" no formulário. Ao ligar, o campo visitante é limpo e escondido; ao salvar grava `away_team` vazio.

4. **Exibição correta na lista do admin**
   - Passa a mostrar `Casa x Visitante` só quando houver visitante; caso contrário mostra apenas o nome do evento (igual aos cards públicos).

5. **Adicionar jogo manual (`AddGameForm`)**
   - Mesma regra: visitante opcional, detecção de esporte usando só os campos preenchidos, e `is_womens` avaliado sobre os nomes existentes.

6. **Duplicar para amanhã** continua funcionando com evento único (já copia o valor vazio).

## Detalhes técnicos

- Arquivos: `src/components/admin/DailyGamesManager.tsx` (validação, rótulos, toggle, render da lista, `AddGameForm`).
- Reutilizar `isNonAdversarial` de `src/lib/gameUtils.ts` em vez de criar nova lista.
- Nenhuma mudança de banco: `away_team` é `not null` com default de string vazia no fluxo atual (o parser já grava `""`), então continuamos gravando string vazia — não `null`.
- Testes: adicionar casos em `src/components/admin/__tests__/` cobrindo salvar um evento sem visitante e a renderização sem o "x".
