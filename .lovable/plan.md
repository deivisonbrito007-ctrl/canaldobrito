

# Reverter Tênis para Não-Adversarial + Melhorias

## Contexto
Os dados de tênis no banco não têm `away_team` — são eventos de torneio (ex: "Miami Open", "ATP e WTA"). A mudança anterior removeu tênis do array `NON_ADVERSARIAL` incorretamente.

## Mudanças

### 1. Reverter `src/lib/gameUtils.ts`
Voltar tênis para o array `NON_ADVERSARIAL`:
```typescript
const NON_ADVERSARIAL: SportType[] = ['f1', 'tennis'];
```

Isso garante que tênis apareça no `LiveEventsSection` com layout centralizado (sem "VS"), que é o correto para esses dados.

## Resultado
- Tênis volta a aparecer como evento (layout centralizado, sem VS)
- F1 continua como evento
- Demais esportes (futebol, basquete, MMA, vôlei) continuam como adversariais com layout VS

