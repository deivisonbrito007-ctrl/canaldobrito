

# Correção de Timezone + Reset à Meia-Noite + Melhorias

## Bug Crítico: Data UTC causa seção vazia entre 21h-23h59

Tanto `LiveNowSection` quanto `DailyGamesSection` usam `new Date().toISOString().split("T")[0]` para calcular "hoje". No Brasil (UTC-3), às 22h local isso retorna a data do dia seguinte em UTC, fazendo com que a query não encontre jogos.

O `isGameCurrentlyLive` já usa data local corretamente — mas a query que busca os jogos usa UTC.

## Plano

### 1. Criar helper `getLocalDateString()` em `gameUtils.ts`
```typescript
export function getLocalDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
```

### 2. Corrigir `LiveNowSection.tsx`
- Substituir `new Date().toISOString().split("T")[0]` por `getLocalDateString()`
- Adicionar tempo decorrido nos cards ao vivo (ex: "32' ⚽") calculado dinamicamente
- Re-calcular `today` a cada tick para que à meia-noite o componente busque automaticamente os jogos do novo dia

### 3. Corrigir `DailyGamesSection.tsx`
- Mesma correção: usar `getLocalDateString()` em vez de `toISOString()`
- Re-calcular `today` a cada tick para reset automático à meia-noite

### 4. Adicionar helper `getElapsedMinutes()` em `gameUtils.ts`
- Calcula minutos desde o início do jogo para exibir nos cards ao vivo

### 5. Melhorias no Dashboard (`AdminDashboard.tsx`)
- Adicionar card "Jogos Hoje" com contagem de jogos do dia
- Adicionar ação rápida para Programação

### 6. Testes unitários (`gameUtils.test.ts`)
- Testar `isGameCurrentlyLive` com cenários: dentro da janela, fora, data diferente
- Testar `getLocalDateString` retorna formato correto

## Arquivos a editar

| Arquivo | Mudança |
|---------|---------|
| `src/lib/gameUtils.ts` | Adicionar `getLocalDateString()` e `getElapsedMinutes()` |
| `src/components/public/LiveNowSection.tsx` | Fix UTC, mostrar tempo decorrido, reset à meia-noite |
| `src/components/public/DailyGamesSection.tsx` | Fix UTC, reset à meia-noite |
| `src/pages/admin/AdminDashboard.tsx` | Card jogos hoje + ação rápida |
| `src/lib/gameUtils.test.ts` | Testes unitários |

## Sugestão extra

- **Jogos de madrugada (00h-05h)**: Considerar que jogos das 00h às 05h podem pertencer à programação do dia anterior. Atualmente, um jogo às 01h do dia 20 só aparece se a data for 20. Isso está correto porque o admin agenda com a data correta, mas vale manter assim para simplicidade.

