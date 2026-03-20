

# Corrigir Layout para Esportes Não-Adversariais

## Problema

O hero "Próximo Jogo" e os cards de programação sempre mostram `home_team VS away_team`, mas para motorsport (F1, Moto3), os dados são armazenados como "Moto3" x "Grande Prêmio do Brasil" — que não faz sentido como dois times adversários. O `LiveNowSection` já trata isso (linhas 100-106), mas `NextGameHero` e `GameCard` não.

Além disso, o label diz "Próximo jogo" fixo — deveria adaptar para "Próximo evento" em esportes não-adversariais.

## Plano

### 1. Definir quais esportes são "não-adversariais" (`gameUtils.ts`)
Exportar helper:
```typescript
const NON_ADVERSARIAL: SportType[] = ['f1'];
export const isNonAdversarial = (st: SportType) => NON_ADVERSARIAL.includes(st);
```

### 2. Corrigir `NextGameHero.tsx`
- Label adaptativo: "Próximo evento" para F1/motorsport, "Próximo jogo" para os demais
- Layout de times: se `isNonAdversarial`, mostrar nome centralizado (`home_team — away_team`) em vez de `home VS away`
- Manter horário e countdown no centro

### 3. Corrigir `GameCard` em `DailyGamesSection.tsx`
- Se `isNonAdversarial`, usar layout centralizado (igual ao LiveNowSection linhas 100-106)
- Remover o separador "vs" para esses esportes

### Arquivos
- `src/lib/gameUtils.ts` — adicionar `isNonAdversarial`
- `src/components/public/NextGameHero.tsx` — layout adaptativo
- `src/components/public/DailyGamesSection.tsx` — layout adaptativo no GameCard

