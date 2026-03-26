

## Melhorar identificação visual dos esportes na seção "Ao Vivo"

### Problema atual
Os cards usam apenas um emoji pequeno (9px) junto ao nome da liga para diferenciar os esportes. Em telas mobile, isso é difícil de perceber rapidamente — o usuário precisa ler o texto para saber se é futebol, NBA, etc.

### Proposta: Badge de esporte colorido

Adicionar um **badge/pill do esporte** visualmente destacado no card, usando a cor de acento já existente por esporte (`SPORT_ACCENT`) e o label em português (`SPORT_LABEL` do `gameUtils.ts`).

### Alterações em `src/components/public/LiveNowHero.tsx`

**1. Importar `SPORT_LABEL`** de `@/lib/gameUtils`

**2. MatchCard — adicionar badge de esporte:**
- No header do card (onde fica o emoji + liga), substituir o emoji solto por um **badge colorido**:
  ```
  [