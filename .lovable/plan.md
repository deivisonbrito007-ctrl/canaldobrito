

# UFC/MMA: Separar por Cards (Prelims + Main)

## Contexto
O usuário quer postar UFC/MMA em 2 blocos: **Preliminares** e **Card Principal**, cada um com seu horário e duração. Atualmente a duração do MMA é 35min (uma luta), que é incorreto para um card inteiro.

## Mudanças

### 1. `src/lib/gameUtils.ts` — Ajustar duração do MMA
- Mudar `SPORT_DURATION.mma` de `35` para `180` (3 horas — cobre um card completo com margem)
- Isso faz com que cada card (Prelims ou Main) fique ao vivo por ~3h + 15min buffer

### 2. `src/components/admin/ProgramacaoTexto.tsx` — Exemplo no placeholder
- Adicionar exemplo de UFC no placeholder para guiar o admin:
```
UFC 315 (Preliminar)
🥊 MMA (Prelims) / ⏰ 19h00
📺 UFC Fight Pass

UFC 315 (Card Principal)
🥊 MMA (Main Card) / ⏰ 23h00
📺 Combate
```
- O parser já detecta `🥊` como MMA e funciona com o formato atual (home_team = nome do evento, away_team vazio)

### 3. Layout — MMA já é não-adversarial
MMA já está no array `NON_ADVERSARIAL`? Não — atualmente é adversarial (layout VS). Como os cards de UFC não têm "lutador A vs lutador B", precisamos adicionar MMA ao `NON_ADVERSARIAL` para usar o layout centralizado de evento.

Alterar em `gameUtils.ts`:
```typescript
const NON_ADVERSARIAL: SportType[] = ['f1', 'tennis', 'mma'];
```

### 4. Testes — Atualizar `gameUtils.test.ts`
Atualizar o teste que verifica duração do MMA (de 25/35min para 180min+buffer).

## Fluxo de postagem do admin
1. Admin cola texto com 2 entradas: "UFC 315 (Preliminar)" às 19h e "UFC 315 (Card Principal)" às 23h
2. Parser cria 2 registros no `daily_games`, cada um com `sport_type: 'mma'`
3. Prelims fica ao vivo das 19h às ~22h15 (180min + 15min buffer)
4. Main Card fica ao vivo das 23h às ~02h15

## Resultado
- Cada card do UFC aparece como evento ao vivo no seu período correto
- Layout centralizado sem "VS" (adequado para eventos)
- Admin pode postar facilmente via texto formatado

